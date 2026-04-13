import * as functions from "firebase-functions";

export const nextServer = functions.https.onRequest((_req: any, res: any) => {
  res
    .status(501)
    .send(
      "Next.js hosting via Firebase Functions is not wired in this MVP. Deploy Next.js separately or extend this function to run the Next server."
    );
});
