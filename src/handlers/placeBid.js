import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import commonMiddleware from "../lib/commonMiddleware";
import createError from "http-errors";
import validator from "@middy/validator";
import {getAuctionByID} from "./getAuctionByID";
import placeBidSchema from "../lib/schemas/placeBidSchema";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionByID(id);

  if (email === auction.seller) {
    throw new createError.HTTP_STATUS_FORBIDDEN(
        `Cannot bid on your own auction!`
    ) 
  }

  if (email === auction.highestBid.bidder) {
    throw new createError.HTTP_STATUS_FORBIDDEN(
        `Cannot bid on the same bidder twice!`
    )
  }

  if (auction.status !== 'OPEN') {
    throw new createError.HTTP_STATUS_FORBIDDEN(
        `Cannot bid on closed auctions!`
    )
  }

  if (amount <= auction.highestBid.amount) {
    throw new createError.HTTP_STATUS_BAD_REQUEST(
        `Amount must be greater than ${auction.highestBid.amount}`
    )
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: "set highestBid.amount = :amount, highestBid.bidder = :email",
    ExpressionAttributeValues: {
      ":amount": amount,
      ":bidder": email,
    },
    ReturnValues: "ALL_NEW"
  }

  let updatedAuction;

  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch(error) {
    console.error(error);
    throw new createError.HTTP_STATUS_INTERNAL_SERVER_ERROR(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = commonMiddleware(placeBid)
    .use(validator({
      inputSchema: placeBidSchema,
      ajvOptions: {
        useDefaults: true,
        strict: false,
      },
    }));

