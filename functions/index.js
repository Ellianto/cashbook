const functions = require('firebase-functions')
const admin = require('firebase-admin')

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
}

// const heavyRuntime = {
//   timeoutSeconds: 300,
//   memory: "512MB",
// };

const generateLightRuntimeCloudFunctions = () => {
  return functions.region("asia-southeast2").runWith(lightRuntime).https;
};

exports.addProduct = generateLightRuntimeCloudFunctions().onCall(
  async (data, context) => {
    if (!context.auth && AUTH_REQUIRED) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Mohon login kembali!"
      );
    }

    const productsCollectionReference = admin.firestore().collection("products");

    try {
      // Add a new document with a generated id.
      const docReference = await productsCollectionReference.add({
        name: data.name,
        stock: 0,
        average_price : 0,
      });

      const docSnapshot = await docReference.get();
      const productData = docSnapshot.data()

      return {
        id: docReference.id,
        name: productData.name,
        stock: productData.stock,
        average_price: productData.average_price,
      }
    } catch (error) {
      console.error(error)
      throw new functions.https.HttpsError('internal', 'Error ketika menambahkan produk baru! Coba lagi dalam beberapa saat!');
    }
  }
);
