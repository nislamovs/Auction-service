import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import commonMiddleware from "./commonMiddleware";
import createError from "http-errors";
import * as http from "node:http";
import {getAuctionByID} from "../handlers/getAuctionByID";
import {getAuctions} from "../handlers/getAuctions";
import {getEndedAuctions} from "./getEndedAuctions";

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

export async function closeAuction(event, context) {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auction.id },
    UpdateExpression: 'set #status = :status',
    ExpressionAttributeValues: {
      ':status': 'CLOSED',
    },
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  };

  const result = await dynamodb.update(params).promise();

  const { title, seller, highestBid } = auction;
  const { amount, bidder } = highestBid;

  if (amount === 0) {
    const notifySeller = sqs.sendMessage({
      MessageBody: JSON.stringify({
        subject: 'No bids on Your auction item :(',
        recipient: seller,
        body: `Oh no! Your item "${title}" didn't get any bids!`,
      }),
      QueueUrl: process.env.MAIL_QUEUE_URL,
    }).promise();

    await notifySeller;
  }

  const notifySeller = sqs.sendMessage({
    MessageBody: JSON.stringify({
      subject: 'Your items has been sold!',
      recipient: seller,
      body: `Woohoo! Your item "${title}" has been sold for $${amount} by ${bidder}!`,
    }),
    QueueUrl: process.env.MAIL_QUEUE_URL,
  }).promise();

  const notifyBidder = sqs.sendMessage({
    MessageBody: JSON.stringify({
      subject: 'You won an auction!',
      recipient: bidder,
      body: `What a great deal! You got yourself a "${title}" for $${amount}!`,
    }),
    QueueUrl: process.env.MAIL_QUEUE_URL,
  }).promise();

  return Promise.all([notifySeller, notifyBidder]);
}
