import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "messages";

export class MessageDao {
  async createMessage(userId, messageId, phoneNumber, messageType, messageDirection, messageContent) {
    const messageTimeStamp = Date.now();

    const params = {
      TableName: TABLE_NAME,
      Item: {
        userId,
        messageId,
        phoneNumber,
        messageType,
        messageDirection,
        messageTimeStamp,
        messageContent,
      },
    };

    await docClient.send(new PutCommand(params));
    return messageId;
  }

  async getMessageById(userId, messageId) {
    const params = {
      TableName: TABLE_NAME,
      Key: { 
        userId,
        messageId 
      },
    };

    const { Item } = await docClient.send(new GetCommand(params));
    return Item;
  }

  async getMessagesByUserId(userId, limit = 50) {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false, // to get the latest messages first
      Limit: limit
    };

    const { Items } = await docClient.send(new QueryCommand(params));
    return Items;
  }
}
