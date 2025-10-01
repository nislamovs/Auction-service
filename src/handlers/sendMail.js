import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import commonMiddleware from "../lib/commonMiddleware";
import createError from "http-errors";
import validator from "@middy/validator";
import {getAuctionByID} from "./getAuctionByID";
import placeBidSchema from "../lib/schemas/placeBidSchema";


const ses = new AWS.SES({region: 'eu-central-1'});

async function sendMail(event, context) {
  const record = event.Records[0];
  console.log('record processing', record);
  const email = JSON.parse(record.body);
  const { subject, body, recipient } = email;

  const params = {
    Source: 'aws.email@io.com',
    Destination: {
      ToAddresses: [
        recipient,
      ],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: body,
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    }
  }

  try {
    const result = await ses.sendEmail(params).promise();
    console.log(result);
    return result;
  } catch (error) {
    console.log(error);
  }
}

export const handler = sendMail
