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

// const heavyRuntime = {
//   timeoutSeconds: 300,
//   memory: "512MB",
// };

const generateLightRuntimeCloudFunctions = () => {
  return functions.region("asia-southeast2").runWith(lightRuntime).https;
};

const rootCollectionReference = {
  products: admin.firestore().collection("products"),
  operationals: admin.firestore().collection("operational_expenses"),
};

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
        average_price: 0,
      });

      const docSnapshot = await docReference.get();
      const productData = docSnapshot.data();

      return {
        id: docReference.id,
        name: productData.name,
        stock: productData.stock,
        average_price: productData.average_price,
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
            average_price: docData.average_price,
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
        average_price: productData.average_price,
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

// TODO: See if delete is needed
