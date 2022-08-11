const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firebase_tools = require('firebase-tools');

// For simple console.log compatibility
require("firebase-functions/lib/logger/compat");

const serviceAccount = require("../secrets/cashbook-b57ed-firebase-adminsdk-a0bo2-b627f17361.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Feature flag to quickly enable/disable auth checks
const AUTH_REQUIRED = true;
// Doing this since we're hosting using Firebase Hosting
// and as of now Firebase Hosting is only available here
// If we choose other regions, the callable functions will face
// CORS Issues
// TODO: See if we can deploy + host using surge.sh
// That way we're not bound to putting the function in us-central1
const functionsRegion = "us-central1"

const lightRuntime = {
  timeoutSeconds: 120,
  memory: "256MB",
};

const heavyRuntime = {
  timeoutSeconds: 300,
  memory: "512MB",
};

const generateLightRuntimeCloudFunctions = () => {
  return functions.region(functionsRegion).runWith(lightRuntime).https;
};


const generateHeavyRuntimeCloudFunctions = () => {
  return functions.region(functionsRegion).runWith(heavyRuntime).https;
};

const rootCollectionReference = {
  products: admin.firestore().collection("products"),
  operationals: admin.firestore().collection("operational_expenses"),
  transactions: admin.firestore().collection("transactions"),
};

// NOTE: The keys for this should match the one in
// src/constants/constants.ts for TRANSACTION_TYPES & CATEGORY_TYPES
const transactionSubcollectionReference = {
  DEBIT: {
    PRODUCT: "debit_products",
    // Ideally should be unused unless requirements changed
    // Just adding it here for compatibility
    OPERATIONAL: "debit_operationals",
  },
  CREDIT: {
    PRODUCT: "credit_products",
    OPERATIONAL: "credit_operationals",
  },
};

const opsTxSubcollectionReference = {
  DEBIT: 'debit_operational_transactions',
  CREDIT: 'credit_operational_transactions',
}

const productTxSubcollectionReference = {
  DEBIT: 'debit_product_transactions',
  CREDIT: 'credit_product_transactions',
}

// NOTE: Currently there's no duplicate checks for product/operational categories


exports.addProduct = generateLightRuntimeCloudFunctions().onCall(
  async (data, context) => {
    if (!context.auth && AUTH_REQUIRED) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Mohon login kembali!"
      );
    }

    const productsCollectionReference = rootCollectionReference.products;

    try {
      // Add a new document with a generated id.
      const docReference = await productsCollectionReference.add({
        name: data.name,
        stock: 0,
        average_buy_price: 0,
      });

      const docSnapshot = await docReference.get();
      const productData = docSnapshot.data();

      return {
        id: docReference.id,
        name: productData.name,
        stock: productData.stock,
        average_buy_price: productData.average_buy_price,
      };
    } catch (error) {
      console.error(error);
      throw new functions.https.HttpsError(
        "internal",
        "Error ketika menambahkan produk baru! Coba lagi dalam beberapa saat!"
      );
    }
  }
);

exports.getProducts = generateLightRuntimeCloudFunctions().onCall(
  async (data, context) => {
    if (!context.auth && AUTH_REQUIRED) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Mohon login kembali!"
      );
    }

    const productsCollectionReference = rootCollectionReference.products;

    try {
      const querySnapshot = await productsCollectionReference.get();
      return {
        products: querySnapshot.docs.map((docSnapshot) => {
          const docData = docSnapshot.data();
          return {
            id: docSnapshot.id,
            name: docData.name,
            stock: docData.stock,
            average_buy_price: docData.average_buy_price,
          };
        }),
      };
    } catch (error) {
      console.error(error);
      throw new functions.https.HttpsError(
        "internal",
        "Error menampilkan daftar produk! Coba lagi dalam beberapa saat!"
      );
    }
  }
);

exports.editProduct = generateLightRuntimeCloudFunctions().onCall(
  async (data, context) => {
    if (!context.auth && AUTH_REQUIRED) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Mohon login kembali!"
      );
    }

    const productsCollectionReference = rootCollectionReference.products;

    try {
      const { id: documentId, ...payload } = data;
      const docReference = productsCollectionReference.doc(documentId);

      await docReference.set(payload, { merge: true });

      const productData = await docReference.get();

      return {
        id: docReference.id,
        name: productData.name,
        stock: productData.stock,
        average_buy_price: productData.average_buy_price,
      };
    } catch (error) {
      console.error(error);
      throw new functions.https.HttpsError(
        "internal",
        "Error mengubah produk! Coba lagi dalam beberapa saat!"
      );
    }
  }
);

exports.deleteProduct = generateLightRuntimeCloudFunctions().onCall(async (data, context) => {
  if (!context.auth && AUTH_REQUIRED) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Mohon login kembali!"
    );
  }

  // Check for missing data 
  if (!data.id) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Pastikan ID produk terisi dengan benar!",
    );
  }

  const productsCollectionReference = rootCollectionReference.products;
  const productDocRef = productsCollectionReference.doc(data.id)

  const targetProduct = await productDocRef.get()
  if (!targetProduct.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Produk tidak ditemukan!",
    );
  }

  try {
    // await productDocRef.delete()
    await triggerRecursiveDelete(productDocRef.path)
  } catch (err) {
    console.error(err);
    throw new functions.https.HttpsError(
      "internal",
      "Error menghapus produk! Coba lagi dalam beberapa saat!"
    );
  }
})

exports.addOperationals = generateLightRuntimeCloudFunctions().onCall(
  async (data, context) => {
    if (!context.auth && AUTH_REQUIRED) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Mohon login kembali!"
      );
    }

    const operationalsCollectionReference =
      rootCollectionReference.operationals;

    try {
      // Add a new document with a generated id.
      const docReference = await operationalsCollectionReference.add({
        name: data.name,
      });

      const docSnapshot = await docReference.get();
      const opsData = docSnapshot.data();

      return {
        id: docReference.id,
        name: opsData.name,
      };
    } catch (error) {
      console.error(error);
      throw new functions.https.HttpsError(
        "internal",
        "Error ketika menambahkan kategori operasional baru! Coba lagi dalam beberapa saat!"
      );
    }
  }
);

exports.getOperationals = generateLightRuntimeCloudFunctions().onCall(
  async (data, context) => {
    if (!context.auth && AUTH_REQUIRED) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Mohon login kembali!"
      );
    }

    const operationalsCollectionReference =
      rootCollectionReference.operationals;

    try {
      const querySnapshot = await operationalsCollectionReference.get();
      return {
        operationals: querySnapshot.docs.map((docSnapshot) => {
          const docData = docSnapshot.data();
          return {
            id: docSnapshot.id,
            name: docData.name,
          };
        }),
      };
    } catch (error) {
      console.error(error);
      throw new functions.https.HttpsError(
        "internal",
        "Error menampilkan daftar kategori operasional! Coba lagi dalam beberapa saat!"
      );
    }
  }
);

exports.editOperationals = generateLightRuntimeCloudFunctions().onCall(
  async (data, context) => {
    if (!context.auth && AUTH_REQUIRED) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Mohon login kembali!"
      );
    }

    const operationalsCollectionReference =
      rootCollectionReference.operationals;

    try {
      const { id: documentId, ...payload } = data;
      const docReference = operationalsCollectionReference.doc(documentId);

      await docReference.set(payload, { merge: true });

      const opsData = await docReference.get();

      return {
        id: docReference.id,
        name: opsData.name,
      };
    } catch (error) {
      console.error(error);
      throw new functions.https.HttpsError(
        "internal",
        "Error mengubah kategori operasional! Coba lagi dalam beberapa saat!"
      );
    }
  }
);

exports.deleteOperationals = generateLightRuntimeCloudFunctions().onCall(async (data, context) => {
  if (!context.auth && AUTH_REQUIRED) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Mohon login kembali!"
    );
  }

  // Check for missing data 
  if (!data.id) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Pastikan ID operasional terisi dengan benar!",
    );
  }

  const opsCollectionReference = rootCollectionReference.operationals;
  const opsDocRef = opsCollectionReference.doc(data.id)

  const targetOps = await opsDocRef.get()
  if (!targetOps.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Operasional tidak ditemukan!",
    );
  }

  try {
    // await productDocRef.delete()
    await triggerRecursiveDelete(opsDocRef.path)
  } catch (err) {
    console.error(err);
    throw new functions.https.HttpsError(
      "internal",
      "Error menghapus kategori operasional! Coba lagi dalam beberapa saat!"
    );
  }
})

exports.addTransaction = generateHeavyRuntimeCloudFunctions().onCall(
  async (data, context) => {
    // Check for auth
    if (!context.auth && AUTH_REQUIRED) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Mohon login kembali!"
      );
    }

    // Check for missing data 
    if (!data.transaction_type) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Pastikan jenis transaksi terisi dengan benar!"
      );
    }

    if (!data.expense_type) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Pastikan kategori terisi dengan benar!"
      );
    }

    const transactionsCollectionReference =
      rootCollectionReference.transactions;

    const dateDocRef = transactionsCollectionReference.doc(
      data.transaction_date
    );

    const transactionSubcollRef = dateDocRef.collection(
      transactionSubcollectionReference[data.transaction_type][
      data.expense_type
      ]
    );
    const newTransactionDocRef = transactionSubcollRef.doc(); // Using Auto generated ID

    try {
      // Transaction that will save data to the "transactions" collection
      await admin.firestore().runTransaction(async (tx) => {
        let newEntry = {
          expense_id: data.expense_id,
          amount: data.amount,
        };

        // If it's a product, we handle it differently
        if (data.expense_type === "PRODUCT" && data.expense_id) {
          newEntry = {
            ...newEntry,
            qty: data.qty,
          };
        }

        // And finally write
        tx.set(newTransactionDocRef, newEntry, { merge: true });
      });
    } catch (error) {
      console.error(error);
      throw new functions.https.HttpsError(
        "internal",
        "Error mencatat transaksi! Coba lagi dalam beberapa saat!"
      );
    }
  }
);

// NOTE: For simplicity's sake, for now only support editing amount and/or qty
exports.editTransaction = generateLightRuntimeCloudFunctions().onCall(async (data, context) => {
  if (!context.auth && AUTH_REQUIRED) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Mohon login kembali!"
    );
  }

  // Check for missing data 
  if (!data.transaction_id) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Pastikan ID transaksi terisi dengan benar!",
    );
  }

  if (!data.transaction_date) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Pastikan tanggal transaksi terisi dengan benar!"
    );
  }

  if (!data.transaction_type) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Pastikan jenis transaksi terisi dengan benar!"
    );
  }

  if (!data.expense_type) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Pastikan kategori terisi dengan benar!"
    );
  }

  const transactionsCollectionReference =
    rootCollectionReference.transactions;

  const dateDocRef = transactionsCollectionReference.doc(data.transaction_date)

  const txSubcollRef = dateDocRef.collection(transactionSubcollectionReference[data.transaction_type][
    data.expense_type
  ])
  const targetTransactionDocRef = txSubcollRef.doc(data.transaction_id)
  const targetTransaction = await targetTransactionDocRef.get()
  if (!targetTransaction.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Transaksi tidak ditemukan!",
    );
  }

  try {
    // Transaction that will save data to the "transactions" collection
    await admin.firestore().runTransaction(async (tx) => {
      let updatedEntry = {
        amount: data.amount,
      };

      // If it's a product, we handle it differently
      if (data.expense_type === "PRODUCT") {
        updatedEntry = {
          ...updatedEntry,
          qty: data.qty,
        };
      }

      // And finally write
      tx.set(targetTransactionDocRef, updatedEntry, { merge: true });
    });
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError(
      "internal",
      "Error mengubah transaksi! Coba lagi dalam beberapa saat!"
    );
  }
})

exports.getTransactions = generateHeavyRuntimeCloudFunctions().onCall(async (data, context) => {
  const { start_date: startDate, end_date: endDate } = data;

  if (!context.auth && AUTH_REQUIRED) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Mohon login kembali!"
    );
  }

  const dateTransactionsRef = rootCollectionReference.transactions;

  try {
    const transactionsQueryResult = await dateTransactionsRef
      .where(admin.firestore.FieldPath.documentId(), '>=', startDate)
      .where(admin.firestore.FieldPath.documentId(), '<=', endDate)
      .get()

    const transactionsResponse = []
    if (!transactionsQueryResult.empty) {
      for (let txDocs of transactionsQueryResult.docs) {
        const txData = txDocs.data()

        const txList = [];

        const debitProductTxns = await txDocs.ref.collection(transactionSubcollectionReference['DEBIT']['PRODUCT']).get()
        if (!debitProductTxns.empty) {
          for (let internalTxnDoc of debitProductTxns.docs) {
            const internalTxnData = internalTxnDoc.data()
            txList.push({
              transaction_id: internalTxnDoc.id,
              transaction_type: "DEBIT",
              category_type: "PRODUCT",
              category_id: internalTxnData.expense_id,
              amount: internalTxnData.amount,
              qty: internalTxnData.qty,
            })
          }
        }
        const creditProductTxns = await txDocs.ref.collection(transactionSubcollectionReference['CREDIT']['PRODUCT']).get()
        if (!creditProductTxns.empty) {
          for (let internalTxnDoc of creditProductTxns.docs) {
            const internalTxnData = internalTxnDoc.data()
            txList.push({
              transaction_id: internalTxnDoc.id,
              transaction_type: "CREDIT",
              category_type: "PRODUCT",
              category_id: internalTxnData.expense_id,
              amount: internalTxnData.amount,
              qty: internalTxnData.qty,
            })
          }
        }

        const debitOpsTxns = await txDocs.ref.collection(transactionSubcollectionReference['DEBIT']['OPERATIONAL']).get()
        if (!debitOpsTxns.empty) {
          for (let internalTxnDoc of debitOpsTxns.docs) {
            const internalTxnData = internalTxnDoc.data()
            txList.push({
              transaction_id: internalTxnDoc.id,
              transaction_type: "DEBIT",
              category_type: "OPERATIONAL",
              category_id: internalTxnData.expense_id,
              amount: internalTxnData.amount,
            })
          }
        }

        const creditOpsTxns = await txDocs.ref.collection(transactionSubcollectionReference['CREDIT']['OPERATIONAL']).get()
        if (!creditOpsTxns.empty) {
          for (let internalTxnDoc of creditOpsTxns.docs) {
            const internalTxnData = internalTxnDoc.data()
            txList.push({
              transaction_id: internalTxnDoc.id,
              transaction_type: "CREDIT",
              category_type: "OPERATIONAL",
              category_id: internalTxnData.expense_id,
              amount: internalTxnData.amount,
            })
          }
        }

        transactionsResponse.push({
          date: txDocs.id,
          total_credit: txData.credit_sum,
          total_debit: txData.debit_sum,
          transactions: txList,
        })
      }
    }

    return {
      transactions: transactionsResponse,
    }
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError(
      "internal",
      "Error menampilkan daftar transaksi! Coba lagi dalam beberapa saat!"
    );
  }
})

exports.deleteTransaction = generateLightRuntimeCloudFunctions().onCall(async (data, context) => {
  if (!context.auth && AUTH_REQUIRED) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Mohon login kembali!"
    );
  }

  // Check for missing data 
  if (!data.transaction_id) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Pastikan ID transaksi terisi dengan benar!",
    );
  }

  if (!data.transaction_date) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Pastikan tanggal transaksi terisi dengan benar!"
    );
  }

  if (!data.transaction_type) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Pastikan jenis transaksi terisi dengan benar!"
    );
  }

  if (!data.expense_type) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Pastikan kategori terisi dengan benar!"
    );
  }

  const transactionsCollectionReference =
    rootCollectionReference.transactions;

  const dateDocRef = transactionsCollectionReference.doc(data.transaction_date)
  dateDocRef.data

  const txSubcollRef = dateDocRef.collection(transactionSubcollectionReference[data.transaction_type][
    data.expense_type
  ])
  const targetTransactionDocRef = txSubcollRef.doc(data.transaction_id)

  const targetTransaction = await targetTransactionDocRef.get()
  if (!targetTransaction.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Transaksi tidak ditemukan!",
    );
  }

  const txData = targetTransaction.data()

  // Try to get the next transaction date in product tx collections if this is a product doc
  let afterTxDateDocsQuery = null;
  if (data.expense_type === "PRODUCT") {
    afterTxDateDocsQuery = rootCollectionReference.products
      .doc(txData.expense_id)
      .collection('product_transactions')
      .where(admin.firestore.FieldPath.documentId(), ">", data.transaction_date)
      .orderBy(admin.firestore.FieldPath.documentId(), "asc")
      .limit(1)
  }

  try {
    await admin.firestore().runTransaction(async (tx) => {
      if (afterTxDateDocsQuery) {
        const afterTxDateDocs = await tx.get(afterTxDateDocsQuery)
        if (!afterTxDateDocs.empty) {
          // If there's a date document found in product tx collection
          // after this date, let's reset the prev_data since we purposefully
          // deleted the transaction here. The only case (as of now)
          // where we want to keep the prev_data is when doing recap
          // (which is done via the bulkDeleteTransactionByDate below)
          const afterTxDoc = afterTxDateDocs.docs[0]
          const afterTxData = afterTxDoc.data()
          if (afterTxData.prev_data) {
            delete afterTxData.prev_data
          }
          await tx.set(afterTxDoc.ref, afterTxData)
        }
      }

      // await targetTransactionDocRef.delete()
      await tx.delete(targetTransactionDocRef)
    })
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError(
      "internal",
      "Error menghapus transaksi! Coba lagi dalam beberapa saat!"
    );
  }
})

exports.bulkDeleteTransactionByDate = generateHeavyRuntimeCloudFunctions().onCall(async (data, context) => {
  if (!context.auth && AUTH_REQUIRED) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Mohon login kembali!"
    );
  }

  // Check for missing data 
  if (!data.start_date) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Pastikan tanggal mulai terisi dengan benar!",
    );
  }

  if (!data.end_date) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Pastikan tanggal selesai terisi dengan benar!",
    );
  }

  const { start_date: startDate, end_date: endDate } = data;

  const dateTransactionsRef = rootCollectionReference.transactions;

  try {
    const transactionsQueryResult = await dateTransactionsRef
      .where(admin.firestore.FieldPath.documentId(), '>=', startDate)
      .where(admin.firestore.FieldPath.documentId(), '<=', endDate)
      .get()

    if (!transactionsQueryResult.empty) {
      const targetDocRefs = transactionsQueryResult.docs.map((doc) => doc.ref)
      console.log(`Starting recursive delete on ${targetDocRefs.length} date documents`)
      await Promise.allSettled(targetDocRefs.map((docRef) => triggerRecursiveDelete(docRef.path)))
    }
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError(
      "internal",
      "Error menghapus transaksi! Coba lagi dalam beberapa saat!"
    );
  }
})

const recalculateProductAveragePrices = async (productId, startTransactionDate) => {
  console.log(`Recalculating product average prices for product ID ${productId} starting from ${startTransactionDate}`)

  const productRef = rootCollectionReference.products.doc(productId)
  const productTransactionsRef = productRef.collection('product_transactions')
  const afterTxDateDocs = productTransactionsRef
    .where(admin.firestore.FieldPath.documentId(), ">=", startTransactionDate)
    .orderBy(admin.firestore.FieldPath.documentId(), "asc")

  const prevTransactionDateQuery = productTransactionsRef
    .where(admin.firestore.FieldPath.documentId(), "<", startTransactionDate)
    .orderBy(admin.firestore.FieldPath.documentId())

  let prevDoc = null;
  const prevDocs = await prevTransactionDateQuery.get()
  if (!prevDocs.empty) {
    prevDoc = await prevDocs.docs[prevDocs.size - 1].data()
  }

  const docsToChange = await afterTxDateDocs.get()
  for (let doc of docsToChange.docs) {
    const docRef = productTransactionsRef.doc(doc.id)
    const initialDoc = await docRef.get()
    const docData = initialDoc.data()

    // CREDIT TRANSACTION means we're purchasing products, so QTY is IN
    let creditSum = 0;
    let qtyInSum = 0;
    const creditTxnsRef = productTransactionsRef.doc(doc.id).collection(productTxSubcollectionReference.CREDIT)
    const creditTxns = await creditTxnsRef.get()
    for (let creditTxnDoc of creditTxns.docs) {
      const creditTxnData = creditTxnDoc.data()
      creditSum += creditTxnData.amount;
      qtyInSum += creditTxnData.qty;
    }
    docData.total_credit = creditSum;
    docData.total_qty_in = qtyInSum;

    // DEBIT TRANSACTION means we're selling products, so QTY is OUT
    let debitSum = 0;
    let qtyOutSum = 0;
    const debitTxnsRef = productTransactionsRef.doc(doc.id).collection(productTxSubcollectionReference.DEBIT)
    const debitTxns = await debitTxnsRef.get()
    for (let debitTxnDoc of debitTxns.docs) {
      const debitTxnData = debitTxnDoc.data()
      debitSum += debitTxnData.amount;
      qtyOutSum += debitTxnData.qty;
    }
    docData.total_debit = debitSum;
    docData.total_qty_out = qtyOutSum;

    // This doc has no subcollections, remove this
    if (creditTxns.empty && debitTxns.empty) {
      await docRef.delete()
      continue
    }

    const deltaStock = qtyInSum - qtyOutSum;
    if (!prevDoc) {
      if (docData.prev_data) {
        // If there's a previous data, we'll still use 
        // that as a reference to calculate the avg price and stock
        // To make sure the data for this date is still up to date
        // even though the previous dates are deleted
        if ((docData.prev_data.stock + qtyInSum) > 0) {
          docData.current_average_price = (
            (docData.prev_data.stock * docData.prev_data.average_price)
            + creditSum)
            / (docData.prev_data.stock + qtyInSum)
        }

        docData.current_stock = Number((docData.prev_data.stock + deltaStock).toFixed(1));
      } else {
        // No previous doc means that this document is the earliest
        // No previous data means we can do the simple calculation
        if (qtyInSum > 0) {
          docData.current_average_price = creditSum / qtyInSum;
        }
        docData.current_stock = Number(deltaStock.toFixed(1));
        docData.prev_data = {
          stock: 0,
          average_price: 0,
        }
      }
    } else {
      // If there's a previous doc, we'll need to use their stats to calculate
      // the avg price and stock
      if ((prevDoc.current_stock + qtyInSum) > 0) {
        docData.current_average_price = (
          (prevDoc.current_stock * prevDoc.current_average_price)
          + creditSum)
          / (prevDoc.current_stock + qtyInSum)
      }

      docData.current_stock = Number((prevDoc.current_stock + deltaStock).toFixed(1));
      docData.prev_data = {
        stock: prevDoc.current_stock,
        average_price: prevDoc.current_average_price,
      };
    }

    await docRef.set({
      ...docData,
      current_average_price: isNaN(docData.current_average_price) ||
        (isNaN(docData.current_stock) || docData.current_stock === 0)
        ? 0 : docData.current_average_price,
      current_stock: isNaN(docData.current_stock) ? 0 : docData.current_stock,
    }, { merge: true })

    prevDoc = docData;
  }

  // On the last entry, we save the stock + avg price
  // to the parent collection
  if (prevDoc) {
    await productRef.set({
      stock: isNaN(prevDoc.current_stock) ? 0 : prevDoc.current_stock,
      average_buy_price: isNaN(prevDoc.current_average_price) || 
        (isNaN(prevDoc.current_stock) || prevDoc.current_stock === 0) 
        ? 0 : prevDoc.current_average_price,
    }, { merge: true })
  }
}

const triggerRecursiveDelete = async (targetPath) => {
  console.log(
    `Starting recursive delete for ${targetPath}`
  );

  // Run a recursive delete on the given document or collection path.
  // The 'token' must be set in the functions config, and can be generated
  // at the command line by running 'firebase login:ci'.
  await firebase_tools.firestore
    .delete(targetPath, {
      project: process.env.GCLOUD_PROJECT,
      recursive: true,
      force: true,
      token: process.env.RECURSIVE_DELETE_TOKEN,
    });

  console.log("Recursive delete done!")
}

// Firestore triggered cloud functions
exports.onDateTransactionCreated = functions.region(functionsRegion).firestore
  .document("/transactions/{transactionDate}/{transactionType}/{transactionId}")
  .onCreate(async (snap, context) => {
    const data = snap.data()

    const { transactionDate, transactionType, transactionId } = context.params;

    const transactionDateDocRef = rootCollectionReference.transactions.doc(transactionDate);

    console.log(`Triggering onDateTransactionCreated due to new doc in /transactions/${transactionDate}/${transactionType}/${transactionId}`)

    try {
      // Transaction to write to either products/operationals sub-collection
      await admin.firestore().runTransaction(async (tx) => {
        let txnDateDocRef = null
        let subcollectionRef = null;
        let dataToWrite = { amount: data.amount ? data.amount : 0 };

        switch (transactionType) {
          case transactionSubcollectionReference['DEBIT']['OPERATIONAL']:
          case transactionSubcollectionReference['CREDIT']['OPERATIONAL']:
            txnDateDocRef = rootCollectionReference.operationals.doc(data.expense_id).collection('operational_transactions').doc(transactionDate)
            break;
          case transactionSubcollectionReference['DEBIT']['PRODUCT']:
          case transactionSubcollectionReference['CREDIT']['PRODUCT']:
            txnDateDocRef = rootCollectionReference.products.doc(data.expense_id).collection('product_transactions').doc(transactionDate)
            break;
          default:
            break;
        }

        if (!txnDateDocRef) {
          return `Invalid subcollection reference! Date : ${transactionDate}; Type : ${transactionType}; ID : ${transactionId}`
        }

        const txnDateDoc = await tx.get(txnDateDocRef)
        if (!txnDateDoc.exists) {

          let newData = {
            total_credit: 0,
            total_debit: 0,
          };

          if (transactionType === transactionSubcollectionReference['CREDIT']['PRODUCT'] || transactionType === transactionSubcollectionReference['DEBIT']['PRODUCT']) {
            newData = {
              ...newData,
              total_qty_in: 0,
              total_qty_out: 0,
              current_average_price: 0,
              current_stock: 0,
            }
          }

          await tx.set(txnDateDocRef, newData, { merge: true })
        }

        switch (transactionType) {
          case transactionSubcollectionReference['DEBIT']['OPERATIONAL']:
            subcollectionRef = txnDateDocRef.collection(opsTxSubcollectionReference.DEBIT).doc(transactionId)
            break;
          case transactionSubcollectionReference['CREDIT']['OPERATIONAL']:
            subcollectionRef = txnDateDocRef.collection(opsTxSubcollectionReference.CREDIT).doc(transactionId)
            break;
          case transactionSubcollectionReference['DEBIT']['PRODUCT']:
            subcollectionRef = txnDateDocRef.collection(productTxSubcollectionReference.DEBIT).doc(transactionId)
            dataToWrite = {
              ...dataToWrite,
              qty: data.qty ? data.qty : 0,
            }
            break;
          case transactionSubcollectionReference['CREDIT']['PRODUCT']:
            subcollectionRef = txnDateDocRef.collection(productTxSubcollectionReference.CREDIT).doc(transactionId)
            dataToWrite = {
              ...dataToWrite,
              qty: data.qty ? data.qty : 0,
            }
            break;
          default:
            break;
        }

        await tx.set(subcollectionRef, dataToWrite, { merge: true })
      })

      // Transaction to update Aggregate value under the /transactions/:transactionDate document
      await admin.firestore().runTransaction(async (tx) => {
        const transactionDateDoc = await tx.get(transactionDateDocRef)

        let dateAggrValue = null;
        if (transactionDateDoc.exists) {
          dateAggrValue = transactionDateDoc.data();
        } else {
          dateAggrValue = {
            credit_sum: 0,
            debit_sum: 0,
          };
        }

        switch (transactionType) {
          case transactionSubcollectionReference['DEBIT']['OPERATIONAL']:
          case transactionSubcollectionReference['DEBIT']['PRODUCT']:
            dateAggrValue.debit_sum += data.amount;
            break;
          case transactionSubcollectionReference['CREDIT']['OPERATIONAL']:
          case transactionSubcollectionReference['CREDIT']['PRODUCT']:
            dateAggrValue.credit_sum += data.amount;
            break;
          default:
            break;
        }

        await tx.set(transactionDateDocRef, dateAggrValue, { merge: true })
      })


    } catch (error) {
      console.error(error)
      throw error
    }
  })

exports.onDateTransactionUpdated = functions.region(functionsRegion).firestore
  .document("/transactions/{transactionDate}/{transactionType}/{transactionId}")
  .onUpdate(async (change, context) => {
    const oldData = change.before.data()
    const newData = change.after.data()

    const { transactionDate, transactionType, transactionId } = context.params;

    const transactionDateDocRef = rootCollectionReference.transactions.doc(transactionDate);

    console.log(`Triggering onDateTransactionUpdated due to updated doc in /transactions/${transactionDate}/${transactionType}/${transactionId}`)

    try {
      // Transaction to update the data in products/operationals sub-collection
      await admin.firestore().runTransaction(async (tx) => {
        let txnDateDocRef = null
        let subcollectionRef = null;
        let dataToWrite = { amount: newData.amount ? newData.amount : 0 };

        switch (transactionType) {
          case transactionSubcollectionReference['DEBIT']['OPERATIONAL']:
          case transactionSubcollectionReference['CREDIT']['OPERATIONAL']:
            txnDateDocRef = rootCollectionReference.operationals.doc(newData.expense_id).collection('operational_transactions').doc(transactionDate)
            break;
          case transactionSubcollectionReference['DEBIT']['PRODUCT']:
          case transactionSubcollectionReference['CREDIT']['PRODUCT']:
            txnDateDocRef = rootCollectionReference.products.doc(newData.expense_id).collection('product_transactions').doc(transactionDate)
            break;
          default:
            break;
        }

        if (!txnDateDocRef) {
          return `Invalid subcollection reference! Date : ${transactionDate}; Type : ${transactionType}; ID : ${transactionId}`
        }

        const txnDateDoc = await tx.get(txnDateDocRef)
        if (!txnDateDoc.exists) {
          return `Document does not exist in ${txnDateDocRef.path}`
        }

        switch (transactionType) {
          case transactionSubcollectionReference['DEBIT']['OPERATIONAL']:
            subcollectionRef = txnDateDocRef.collection(opsTxSubcollectionReference.DEBIT).doc(transactionId)
            break;
          case transactionSubcollectionReference['CREDIT']['OPERATIONAL']:
            subcollectionRef = txnDateDocRef.collection(opsTxSubcollectionReference.CREDIT).doc(transactionId)
            break;
          case transactionSubcollectionReference['DEBIT']['PRODUCT']:
            subcollectionRef = txnDateDocRef.collection(productTxSubcollectionReference.DEBIT).doc(transactionId)
            dataToWrite = {
              ...dataToWrite,
              qty: newData.qty ? newData.qty : 0,
            }
            break;
          case transactionSubcollectionReference['CREDIT']['PRODUCT']:
            subcollectionRef = txnDateDocRef.collection(productTxSubcollectionReference.CREDIT).doc(transactionId)
            dataToWrite = {
              ...dataToWrite,
              qty: newData.qty ? newData.qty : 0,
            }
            break;
          default:
            break;
        }

        await tx.set(subcollectionRef, dataToWrite, { merge: true })
      })

      // Transaction to update Aggregate value under the /transactions/:transactionDate document
      await admin.firestore().runTransaction(async (tx) => {
        const transactionDateDoc = await tx.get(transactionDateDocRef)

        let dateAggrValue = null;
        if (transactionDateDoc.exists) {
          dateAggrValue = transactionDateDoc.data();
        } else {
          dateAggrValue = {
            credit_sum: 0,
            debit_sum: 0,
          };
        }

        switch (transactionType) {
          case transactionSubcollectionReference['DEBIT']['OPERATIONAL']:
          case transactionSubcollectionReference['DEBIT']['PRODUCT']:
            if (oldData.amount > newData.amount) {
              dateAggrValue.debit_sum -= oldData.amount - newData.amount;
            } else {
              dateAggrValue.debit_sum += newData.amount - oldData.amount;
            }
            break;
          case transactionSubcollectionReference['CREDIT']['OPERATIONAL']:
          case transactionSubcollectionReference['CREDIT']['PRODUCT']:
            if (oldData.amount > newData.amount) {
              dateAggrValue.credit_sum -= oldData.amount - newData.amount;
            } else {
              dateAggrValue.credit_sum += newData.amount - oldData.amount;
            }
            break;
          default:
            break;
        }

        await tx.set(transactionDateDocRef, dateAggrValue, { merge: true })
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  })

exports.onDateTransactionDeleted = functions.region(functionsRegion).firestore
  .document("/transactions/{transactionDate}/{transactionType}/{transactionId}")
  .onDelete(async (snap, context) => {
    const data = snap.data()

    const { transactionDate, transactionType, transactionId } = context.params;

    const transactionDateDocRef = rootCollectionReference.transactions.doc(transactionDate);

    console.log(`Triggering onTransactionDeleted due to removed doc /transactions/${transactionDate}/${transactionType}/${transactionId}`)
    try {
      // Transaction to also remove the document stored in the product/operationals subcollection
      await admin.firestore().runTransaction(async (tx) => {
        let txnDateDocRef = null;
        switch (transactionType) {
          case transactionSubcollectionReference['DEBIT']['OPERATIONAL']:
          case transactionSubcollectionReference['CREDIT']['OPERATIONAL']:
            txnDateDocRef = rootCollectionReference.operationals.doc(data.expense_id).collection('operational_transactions').doc(transactionDate)
            break;
          case transactionSubcollectionReference['DEBIT']['PRODUCT']:
          case transactionSubcollectionReference['CREDIT']['PRODUCT']:
            txnDateDocRef = rootCollectionReference.products.doc(data.expense_id).collection('product_transactions').doc(transactionDate)
            break;
          default:
            break;
        }

        let subDocRef = null;

        switch (transactionType) {
          case transactionSubcollectionReference['DEBIT']['OPERATIONAL']:
            subDocRef = txnDateDocRef.collection(opsTxSubcollectionReference.DEBIT).doc(transactionId)
            break;
          case transactionSubcollectionReference['CREDIT']['OPERATIONAL']:
            subDocRef = txnDateDocRef.collection(opsTxSubcollectionReference.CREDIT).doc(transactionId)
            break;
          case transactionSubcollectionReference['DEBIT']['PRODUCT']:
            subDocRef = txnDateDocRef.collection(productTxSubcollectionReference.DEBIT).doc(transactionId)
            break;
          case transactionSubcollectionReference['CREDIT']['PRODUCT']:
            subDocRef = txnDateDocRef.collection(productTxSubcollectionReference.CREDIT).doc(transactionId)
            break;
          default:
            break;
        }

        const targetTransaction = await tx.get(subDocRef)
        if (!targetTransaction.exists) {
          console.log(`Transaction ${subDocRef.path} not found! Might have been deleted before`)
          return
        }

        await tx.delete(subDocRef)
      })

      // Transaction to update the aggregate value 
      await admin.firestore().runTransaction(async (tx) => {
        const txDateDoc = await tx.get(transactionDateDocRef);

        if (txDateDoc.exists) {
          const docData = txDateDoc.data()

          switch (transactionType) {
            case transactionSubcollectionReference['DEBIT']['OPERATIONAL']:
            case transactionSubcollectionReference['DEBIT']['PRODUCT']:
              // The removed document is a DEBIT transaction
              docData.debit_sum -= data.amount
              break;
            case transactionSubcollectionReference['CREDIT']['OPERATIONAL']:
            case transactionSubcollectionReference['CREDIT']['PRODUCT']:
              // The removed document is a DEBIT transaction
              docData.credit_sum -= data.amount
              break;
            default:
              break;
          }

          await tx.set(transactionDateDocRef, docData, { merge: true })
        }
      })

      // Removing the date document in case the subcollection is empty
      await admin.firestore().runTransaction(async (tx) => {
        const dateDoc = await tx.get(transactionDateDocRef)
        const dateDocData = dateDoc.data()
        if (dateDocData.credit_sum === 0 && dateDocData.debit_sum === 0) {
          await tx.delete(transactionDateDocRef)
        }
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  })

exports.onOperationalTransactionCreated = functions.region(functionsRegion).firestore
  .document("/operational_expenses/{operationalId}/operational_transactions/{transactionDate}/{transactionType}/{transactionId}")
  .onCreate(async (snap, context) => {
    const data = snap.data()

    const { operationalId, transactionDate, transactionType, transactionId } = context.params;

    console.log(`Triggering onOperationalTransactionCreated due to new document in
      /operational_expenses/${operationalId}/operational_transactions/${transactionDate}/${transactionType}/${transactionId}`)

    const opsTransactionForDateRef = rootCollectionReference.operationals.doc(operationalId)
      .collection('operational_transactions')
      .doc(transactionDate)

    const creditOpsTxCollRef = opsTransactionForDateRef.collection(opsTxSubcollectionReference.CREDIT)
    const debitOpsTxCollRef = opsTransactionForDateRef.collection(opsTxSubcollectionReference.DEBIT)

    try {
      await admin.firestore().runTransaction(async (tx) => {
        const creditOpsTxDocs = await tx.get(creditOpsTxCollRef)

        let totalCredit = 0;
        for (let doc of creditOpsTxDocs.docs) {
          const creditData = doc.data()
          totalCredit += creditData.amount;
        }

        const debitOpsTxDocs = await tx.get(debitOpsTxCollRef)
        let totalDebit = 0;
        for (let doc of debitOpsTxDocs.docs) {
          const debitData = doc.data()
          totalDebit += debitData.amount;
        }

        await tx.set(opsTransactionForDateRef, {
          total_credit: totalCredit,
          total_debit: totalDebit,
        }, { merge: true })
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  })

exports.onOperationalTransactionUpdated = functions.region(functionsRegion).firestore
  .document("/operational_expenses/{operationalId}/operational_transactions/{transactionDate}/{transactionType}/{transactionId}")
  .onCreate(async (change, context) => {
    const { operationalId, transactionDate, transactionType, transactionId } = context.params;

    console.log(`Triggering onOperationalTransactionUpdated due to updated doc in
      /operational_expenses/${operationalId}/operational_transactions/${transactionDate}/${transactionType}/${transactionId}`)

    const opsTransactionForDateRef = rootCollectionReference.operationals.doc(operationalId)
      .collection('operational_transactions')
      .doc(transactionDate)

    const creditOpsTxCollRef = opsTransactionForDateRef.collection(opsTxSubcollectionReference.CREDIT)
    const debitOpsTxCollRef = opsTransactionForDateRef.collection(opsTxSubcollectionReference.DEBIT)

    try {
      await admin.firestore().runTransaction(async (tx) => {
        const creditOpsTxDocs = await tx.get(creditOpsTxCollRef)

        let totalCredit = 0;
        for (let doc of creditOpsTxDocs.docs) {
          const creditData = doc.data()
          totalCredit += creditData.amount;
        }

        const debitOpsTxDocs = await tx.get(debitOpsTxCollRef)
        let totalDebit = 0;
        for (let doc of debitOpsTxDocs.docs) {
          const debitData = doc.data()
          totalDebit += debitData.amount;
        }

        await tx.set(opsTransactionForDateRef, {
          total_credit: totalCredit,
          total_debit: totalDebit,
        }, { merge: true })
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  })

exports.onOperationalTransactionDeleted = functions.region(functionsRegion).firestore
  .document("/operational_expenses/{operationalId}/operational_transactions/{transactionDate}/{transactionType}/{transactionId}")
  .onDelete(async (snap, context) => {
    const data = snap.data()

    const { operationalId, transactionDate, transactionType, transactionId } = context.params;

    console.log(`Triggering onOperationalTransactionDeleted due to removed doc
      /operational_expenses/${operationalId}/operational_transactions/${transactionDate}/${transactionType}/${transactionId}`)

    const opsTransactionForDateRef = rootCollectionReference.operationals.doc(operationalId)
      .collection('operational_transactions')
      .doc(transactionDate)

    try {
      const opsTxForDateDoc = await opsTransactionForDateRef.get()
      if (opsTxForDateDoc.exists) {
        // The doc still exists, re-calculate the aggregate for transactions
        const creditOpsTxCollRef = opsTransactionForDateRef.collection(opsTxSubcollectionReference.CREDIT)
        const debitOpsTxCollRef = opsTransactionForDateRef.collection(opsTxSubcollectionReference.DEBIT)

        // Re-calculate the aggregate
        await admin.firestore().runTransaction(async (tx) => {
          const creditOpsTxDocs = await tx.get(creditOpsTxCollRef)

          let totalCredit = 0;
          for (let doc of creditOpsTxDocs.docs) {
            const creditData = doc.data()
            totalCredit += creditData.amount;
          }

          const debitOpsTxDocs = await tx.get(debitOpsTxCollRef)
          let totalDebit = 0;
          for (let doc of debitOpsTxDocs.docs) {
            const debitData = doc.data()
            totalDebit += debitData.amount;
          }

          if (totalCredit === 0 && totalDebit === 0) {
            await tx.delete(opsTransactionForDateRef)
          } else {
            await tx.set(opsTransactionForDateRef, {
              total_credit: totalCredit,
              total_debit: totalDebit,
            }, { merge: true })
          }
        })
      } else {
        // The doc doesn't exist anymore, this function is triggered from recursive delete
        const txDateDocRef = rootCollectionReference.transactions.doc(transactionDate)

        let txDateSubcollRef = null;
        switch (transactionType) {
          case opsTxSubcollectionReference.DEBIT:
            txDateSubcollRef = txDateDocRef.collection(transactionSubcollectionReference.DEBIT.OPERATIONAL)
            break;
          case opsTxSubcollectionReference.CREDIT:
            txDateSubcollRef = txDateDocRef.collection(transactionSubcollectionReference.CREDIT.OPERATIONAL)
            break;
          default:
            break;
        }

        if (txDateSubcollRef) {
          const txDocRef = txDateSubcollRef.doc(transactionId)

          const txDoc = await txDocRef.get()
          if (!txDoc.exists) {
            console.log(`Transaction ${txDocRef.path} not found! Might have been deleted before`)
            return
          }

          await txDocRef.delete()
        }
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  })

// NOTE: Three functions below can be merged into one using "onWrite" to save quota
// since all they do is just recalculate
exports.onProductTransactionCreated = functions.region(functionsRegion).firestore
  .document("/products/{productId}/product_transactions/{transactionDate}/{transactionType}/{transactionId}")
  .onCreate(async (snap, context) => {
    const { productId, transactionDate, transactionType, transactionId } = context.params;

    console.log(`Triggering onProductTransactionCreated due to new doc in
      /products/${productId}/product_transactions/${transactionDate}/${transactionType}/${transactionId}`)

    await recalculateProductAveragePrices(productId, transactionDate)
  })

exports.onProductTransactionUpdated = functions.region(functionsRegion).firestore
  .document("/products/{productId}/product_transactions/{transactionDate}/{transactionType}/{transactionId}")
  .onUpdate(async (snap, context) => {
    const { productId, transactionDate, transactionType, transactionId } = context.params;

    console.log(`Triggering onProductTransactionUpdated due to updated doc in
      /products/${productId}/product_transactions/${transactionDate}/${transactionType}/${transactionId}`)

    await recalculateProductAveragePrices(productId, transactionDate)
  })

exports.onProductTransactionDeleted = functions.region(functionsRegion).firestore
  .document("/products/{productId}/product_transactions/{transactionDate}/{transactionType}/{transactionId}")
  .onDelete(async (snap, context) => {
    const { productId, transactionDate, transactionType, transactionId } = context.params;

    console.log(`Triggering onProductTransactionDeleted due to removed doc
      /products/${productId}/product_transactions/${transactionDate}/${transactionType}/${transactionId}`)

    const productRef = rootCollectionReference.products.doc(productId)
    const targetProductDoc = await productRef.get()
    if (targetProductDoc.exists) {
      // The product still exists, do the re-calculation
      await recalculateProductAveragePrices(productId, transactionDate)
    } else {
      // The product doesn't exist anymore, this function is triggered from recursive delete
      const txDateDocRef = rootCollectionReference.transactions.doc(transactionDate)

      let txDateSubcollRef = null;
      switch (transactionType) {
        case productTxSubcollectionReference.DEBIT:
          txDateSubcollRef = txDateDocRef.collection(transactionSubcollectionReference.DEBIT.PRODUCT)
          break;
        case productTxSubcollectionReference.CREDIT:
          txDateSubcollRef = txDateDocRef.collection(transactionSubcollectionReference.CREDIT.PRODUCT)
          break;
        default:
          break;
      }

      if (txDateSubcollRef) {
        const txDocRef = txDateSubcollRef.doc(transactionId)

        const txDoc = await txDocRef.get()
        if (!txDoc.exists) {
          console.log(`Transaction ${txDocRef.path} not found! Might have been deleted before`)
          return
        }

        await txDocRef.delete()
      }
    }
  })