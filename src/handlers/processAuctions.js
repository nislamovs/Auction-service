import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import commonMiddleware from "../lib/commonMiddleware";
import createError from "http-errors";
import * as http from "node:http";
import {getAuctionByID} from "./getAuctionByID";
import {getAuctions} from "./getAuctions";
import {getEndedAuctions} from "../lib/getEndedAuctions";
import {closeAuction} from "../lib/closeAuction";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function processAuctions(event, context) {

  try {
    const auctionsToClose = await getEndedAuctions();
    const closePromises = auctionsToClose.map(auction => closeAuction(auction.id))
    await Promise.all(closePromises);
    return {
     closed: closePromises.length
    };
  } catch (error) {
    console.error(error);
    throw new createError.HTTP_STATUS_INTERNAL_SERVER_ERROR(error);
  }
}

export const handler = processAuctions;


