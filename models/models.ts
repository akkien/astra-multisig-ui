import mongoose from "mongoose";

const MultisigSchema = new mongoose.Schema({
  pubkeyJSON: String,
  address: {
    type: String,
    require: true,
  },
  chainId: {
    type: String,
    require: true,
  },
});
export const Multisig = mongoose.model("Multisig", MultisigSchema);

const SourceAddressSchema = new mongoose.Schema({
  nickname: String,
  address: {
    type: String,
    require: true,
  },
  pubkey: {
    type: String,
    require: true,
  },
  multisig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Multisig",
  },
});
export const SourceAddress = mongoose.model("SourceAddress", SourceAddressSchema);

const TransactionSchema = new mongoose.Schema({
  signatures: [
    {
      bodyBytes: {
        type: String,
        require: true,
      },
      signature: {
        type: String,
        require: true,
      },
      address: {
        type: String,
        require: true,
      },
    },
  ],
  dataJSON: String,
  txHash: String,
});
export const Transaction = mongoose.model("Transaction", TransactionSchema);
