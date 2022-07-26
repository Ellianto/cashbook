const functions = require("firebase-functions");
const admin = require("firebase-admin");

const serviceAccount = require("../secrets/cashbook-b57ed-firebase-adminsdk-a0bo2-b627f17361.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bon-kapal.firebaseio.com",
});

// Feature flag to quickly enable/disable auth checks
const AUTH_REQUIRED = false;

const lightRuntime = {
  timeoutSeconds: 120,
  memory: "256MB",
};

const heavyRuntime = {
  timeoutSeconds: 300,
  memory: "512MB",
};

const generateLightRuntimeCloudFunctions = () => {
  return functions.region("asia-southeast2").runWith(lightRuntime).https;
};

const generateHeavyRuntimeCloudFunctions = () => {
  return functions.region("asia-southeast2").runWith(heavyRuntime).https;
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

exports.addTransactions = generateHeavyRuntimeCloudFunctions().onCall(
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
        const nowUNIX = new Date().valueOf();

        let newEntry = {
          last_updated: nowUNIX,
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

// TODO: Implement DELETE for products and ops categories

// TODO: Implement Edit for Transactions


exports.getTransactions = generateHeavyRuntimeCloudFunctions().onCall(async (data, context) => {
  const { start_date : startDate, end_date: endDate } = data;

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
              transaction_id : internalTxnDoc.id,
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
              transaction_id : internalTxnDoc.id,
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
              transaction_id : internalTxnDoc.id,
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
              transaction_id : internalTxnDoc.id,
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
    const docData = {
      total_credit: 0,
      total_qty_in: 0,
      total_debit: 0,
      total_qty_out: 0,
      current_average_price: 0,
      current_stock: 0,
      last_updated: 0,
    }

    // CREDIT TRANSACTION means we're purchasing products, so QTY is IN
    let creditSum = 0;
    let qtyInSum = 0;
    const creditTxnsRef = productTransactionsRef.doc(doc.id).collection('credit_product_transactions')
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
    const debitTxnsRef = productTransactionsRef.doc(doc.id).collection('debit_product_transactions')
    const debitTxns = await debitTxnsRef.get()
    for (let debitTxnDoc of debitTxns.docs) {
      const debitTxnData = debitTxnDoc.data()
      debitSum += debitTxnData.amount;
      qtyOutSum += debitTxnData.qty;
    }
    docData.total_debit = debitSum;
    docData.total_qty_out = qtyOutSum;

    // TODO: Confirm this is correct
    const deltaStock = qtyInSum - qtyOutSum;
    if (!prevDoc) {
      // No previous doc means that this document is the earliest
      // So the calculation for avg price and stock is easy
      docData.current_average_price = creditSum / qtyInSum;
      docData.current_stock = deltaStock;
    } else {
      // If there's a previous doc, we'll need to use their stats to calculate
      // the avg price and stock
      docData.current_average_price = (
        (prevDoc.current_stock * prevDoc.current_average_price) 
        + creditSum) 
        / (prevDoc.current_stock + qtyInSum)

      docData.current_stock = prevDoc.current_stock + deltaStock;
    }

    const nowUNIX = new Date().valueOf();
    docData.last_updated = nowUNIX;

    const docRef = productTransactionsRef.doc(doc.id)
    await docRef.set(docData, { merge : true })

    prevDoc = docData;
  }

  // On the last entry, we save the stock + avg price
  // to the parent collection
  await productRef.set({
    stock : prevDoc.current_stock,
    average_buy_price: prevDoc.current_average_price,
  }, { merge : true })
}

// Firestore triggered cloud functions
exports.onDateTransactionCreated = functions.firestore
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
        let dataToWrite = { amount : data.amount ?? 0 };
  
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
          return Promise.reject(`Invalid subcollection reference! Date : ${transactionDate}; Type : ${transactionType}; ID : ${transactionId}`)
        }

        const txnDateDoc = await tx.get(txnDateDocRef)
        if (!txnDateDoc.exists) {
          const nowUNIX = new Date().valueOf();

          let newData = {
            last_updated: nowUNIX,
            total_credit: 0,
            total_debit: 0,
          };

          if (transactionType === transactionSubcollectionReference['CREDIT']['PRODUCT'] || transactionType === transactionSubcollectionReference['DEBIT']['PRODUCT'] ) {
            newData = {
              ...newData,
              total_qty_in: 0,
              total_qty_out: 0,
              current_average_price: 0,
              current_stock: 0,
            }
          }

          await tx.set(txnDateDocRef, newData, { merge : true })
        }

        switch (transactionType) {
          case transactionSubcollectionReference['DEBIT']['OPERATIONAL']:
            subcollectionRef = txnDateDocRef.collection('debit_operational_transactions').doc(transactionId)
            break;
          case transactionSubcollectionReference['CREDIT']['OPERATIONAL']:
            subcollectionRef = txnDateDocRef.collection('credit_operational_transactions').doc(transactionId)
            break;
          case transactionSubcollectionReference['DEBIT']['PRODUCT']:
            subcollectionRef = txnDateDocRef.collection('debit_product_transactions').doc(transactionId)
            dataToWrite = {
              ...dataToWrite,
              qty : data.qty ?? 0,
            }
            break;
          case transactionSubcollectionReference['CREDIT']['PRODUCT']:
            subcollectionRef = txnDateDocRef.collection('credit_product_transactions').doc(transactionId)
            dataToWrite = {
              ...dataToWrite,
              qty : data.qty ?? 0,
            }
            break;
          default:
            break;
        }
        
        await tx.set(subcollectionRef, dataToWrite, { merge : true })
      })

      // Transaction to update Aggregate value under the /transactions/:transactionDate document
      await admin.firestore().runTransaction(async (tx) => {
        const transactionDateDoc = await tx.get(transactionDateDocRef)

        let dateAggrValue = null;
        const nowUNIX = new Date().valueOf();
        if (transactionDateDoc.exists) {
          dateAggrValue = transactionDateDoc.data();
        } else {
          dateAggrValue = {
            credit_sum: 0,
            debit_sum: 0,
            last_updated: nowUNIX,
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

        dateAggrValue.last_updated = nowUNIX;
        await tx.set(transactionDateDocRef, dateAggrValue, { merge : true })
      })

      // Re-calculate logic
      // if (transactionType === transactionSubcollectionReference['DEBIT']['PRODUCT'] || transactionType === transactionSubcollectionReference['CREDIT']['PRODUCT']) {
      //   await recalculateProductAveragePrices(data.expense_id, transactionDate)
      // }
    } catch (error) {
      console.error(error)
    }
  })

exports.onOperationalTransactionCreated = functions.firestore
  .document("/operational_expenses/{operationalId}/operational_transactions/{transactionDate}/{transactionType}/{transactionId}")
  .onCreate(async (snap, context) => {
    const data = snap.data()

    const { operationalId, transactionDate, transactionType, transactionId } = context.params;

    console.log(`Triggering onOperationalTransactionCreated due to new document in
      /operational_expenses/${operationalId}/operational_transactions/${transactionDate}/${transactionType}/${transactionId}`)

    const opsTransactionForDateRef = rootCollectionReference.operationals.doc(operationalId)
      .collection('operational_transactions')
      .doc(transactionDate)

    const creditOpsTxCollRef = opsTransactionForDateRef.collection('credit_operational_transactions')
    const debitOpsTxCollRef = opsTransactionForDateRef.collection('debit_operational_transactions')

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

        const nowUNIX = new Date().valueOf();

        await tx.set(opsTransactionForDateRef, {
          total_credit : totalCredit,
          total_debit : totalDebit,
          last_updated : nowUNIX,
        }, { merge : true })
      })
    } catch (error) {
      console.error(error)
    }
  })


exports.onProductTransactionCreated = functions.firestore
  .document("/products/{productId}/product_transactions/{transactionDate}/{transactionType}/{transactionId}")
  .onCreate(async (snap, context) => {
    const data = snap.data()

    const { productId, transactionDate, transactionType, transactionId } = context.params;

    console.log(`Triggering onProductTransactionCreated due to new doc in
      /products/${productId}/product_transactions/${transactionDate}/${transactionType}/${transactionId}`)

    await recalculateProductAveragePrices(productId, transactionDate)
  })