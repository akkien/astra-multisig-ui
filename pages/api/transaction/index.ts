import type { NextApiRequest, NextApiResponse } from "next";
import { Transaction } from "../../../models/models";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "POST":
      try {
        const data = req.body;
        console.log("Function `createTransaction` invoked", data);
        const saveRes = await new Transaction(data.dataJSON).save();
        res.status(200).send({ transactionID: saveRes._id });
        return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.log(err);
        res.status(400).send(err.message);
        return;
      }
  }
  // no route matched
  res.status(405).end();
  return;
}
