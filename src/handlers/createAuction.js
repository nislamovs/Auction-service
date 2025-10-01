import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import commonMiddleware from "../lib/commonMiddleware";
import createError from "http-errors";
import validator from "@middy/validator";
import createAuctionSchema, {cerateAuctionSchema} from "../lib/schemas/createAuctionSchema";
import {getAuctionsSchema} from "../lib/schemas/getAuctionsSchema";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
  const logGroup = process.env.LOG_GROUP_NAME;
  const { title } = JSON.parse(event.body);
  const { email } = event.requestContext.authorizer;
  const now = new Date();
  const endDate = new Date();
  endDate.setHours(now.getDays() + 1);

  const auction = {
    id: uuid(),
    title,
    status: "OPEN",
    created_at: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0,
      bidder: "",
    },
    seller: email
  };

  try {
    await dynamodb.put({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Item: auction,
    }).promise();
  } catch(error) {
    console.error(error);
    throw new createError.HTTP_STATUS_INTERNAL_SERVER_ERROR(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify({ event, context }),
  };
}

export const handler = commonMiddleware(createAuction)
    .use(validator({
      inputSchema: createAuctionSchema,
      ajvOptions: {
        useDefaults: true,
        strict: false,
      },
    }));


