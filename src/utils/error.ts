import { FirebaseError } from "@firebase/app";

import { message } from "antd";

export const handleFirebaseError = (error : any) => {
  let errorMessage = "";
  try {
    const parsedError = error as FirebaseError;
    errorMessage = parsedError.message;
  } catch (error) {
    errorMessage = "Error! Silahkan coba lagi dalam beberapa saat.";
  }

  message.error(errorMessage);
}