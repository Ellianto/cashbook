const functions = require("firebase-functions");
const admin = require("firebase-admin");

const serviceAccount = require("../secrets/cashbook-b57ed-firebase-adminsdk-a0bo2-b627f17361.json");
const { firestore } = require("firebase-admin");

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
    if (!context.auth && AUTH_REQUIRED) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Mohon login kembali!"
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

    const dateDocRef = transactionsCollectionReference.doc(
      data.transaction_date
    );

    const transactionSubcollRef = dateDocRef.collection(
      transactionSubcollectionReference[data.transaction_type][
        data.expense_type
      ]
    );
    const newTransactionDocRef = transactionSubcollRef.doc(); // Using Auto generated ID

    // TODO: Add stock checks here if necessary
    // We'll need this to update the stock and re-calculate avg price
    let productCategoryRef = null;
    if (data.expense_type === "PRODUCT" && data.expense_id) {
      productCategoryRef = rootCollectionReference.products.doc(
        data.expense_id
      );
    }

    try {
      await firestore().runTransaction(async (tx) => {
        // Start with GETs
        const dateAggrDoc = await tx.get(dateDocRef);

        let productCategoryDoc = null;
        if (productCategoryRef !== null) {
          productCategoryDoc = await tx.get(productCategoryRef);
        }

        const nowUNIX = new Date().valueOf();

        // Then process stuffs
        let dateAggrValue = null;
        if (dateAggrDoc.exists) {
          dateAggrValue = dateAggrDoc.data();
        } else {
          dateAggrValue = {
            credit_sum: 0,
            debit_sum: 0,
            last_updated: nowUNIX,
          };
        }

        if (data.transaction_type === "CREDIT") {
          dateAggrValue.credit_sum += data.amount;
        } else {
          dateAggrValue.debit_sum += data.amount;
        }

        let newEntry = {
          last_updated: nowUNIX,
          expense_id: data.expense_id,
          amount: data.amount,
        };

        // If it's a product, we handle it differently
        if (productCategoryDoc) {
          newEntry = {
            ...newEntry,
            qty: data.qty,
          };

          let productCategoryData = productCategoryDoc.data();

          if (data.transaction_type === "CREDIT") {
            // We're buying product (and outputting money) hence credit
            // so we add the stock here (and re-calculate avg price)
            productCategoryData.average_buy_price =
              +(((productCategoryData.average_buy_price *
                productCategoryData.stock) +
                data.amount) /
              (productCategoryData.stock + data.qty)).toFixed(2);
            productCategoryData.stock += data.qty;
          } else {
            // We're selling product (and get money) hence debit
            // so we deduct the stock here (no need to re-calculate avg price)
            // TODO: Add 0 guard here if necessary
            productCategoryData.stock -= data.qty;
          }

          tx.set(productCategoryRef, productCategoryData, { merge: true });
        }

        // And finally write
        tx.set(dateDocRef, dateAggrValue, { merge: true });
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

// TODO: Implement Edit for Transactions (BUT AFTER CONFIRMING)

// TODO: Implement "Aggregate/Group By" Functions for Dashboard
// exports.getTransactions = generateHeavyRuntimeCloudFunctions().onCall(async (data, context) => {
//   const { start_date, end_date } = data;

// })
