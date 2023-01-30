import { myAccountParser } from "./accountParser";

export const CHAIN_ID = "astra_11110-1";
export const COSMOS_RPC = "http://128.199.238.171:26657";
export const COSMOS_REST = "http://128.199.238.171:1317";
export const DENOM = "aastra";

export const ChannelMsgTypeUrl = {
  MsgOpenChannel: "/channel.channel.MsgOpenChannel",
  MsgCloseChannel: "/channel.channel.MsgCloseChannel",
  MsgCommitment: "/channel.channel.MsgCommitment",
  MsgWithdrawHashlock: "/channel.channel.MsgWithdrawHashlock",
  MsgWithdrawTimelock: "/channel.channel.MsgWithdrawTimelock",
  MsgFund: "/channel.channel.MsgFund",
};

export const clientOptions = {
  accountParser: myAccountParser,
};
