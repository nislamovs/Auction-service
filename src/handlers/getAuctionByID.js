import AWS from 'aws-sdk';
import commonMiddleware from "../lib/commonMiddleware";
import createError from "http-errors";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctionByID(event, context) {
  const logGroup = process.env.LOG_GROUP_NAME;
  let auction;
  let id = event.pathParameters.id
  try {
    const result = await dynamodb.get({
      // KeyConditionExpression: "#id = :id",
      // AttributesToGet: ["id", "title", "status", "created_at"],
      // ExpressionAttributeNames: { "#id": "id" },
      // ExpressionAttributeValues: { ":id": id },
      Key: { id },
      TableName: process.env.AUCTIONS_TABLE_NAME,
    }).promise();

    auction = result.Item;
  } catch(error) {
    console.error(error);
    throw new createError.HTTP_STATUS_INTERNAL_SERVER_ERROR(error);
  }

  if (!auction) {
    throw new createError.HTTP_STATUS_NOT_FOUND(`Auction with id ${id} not found`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ auction }),
  };
}

export const handler = commonMiddleware(getAuctionByID);

