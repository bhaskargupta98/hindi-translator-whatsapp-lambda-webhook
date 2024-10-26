import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "users";

export class UserDao {
  async createUser(userId, whatsAppNumber, fullName) {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        userId,
        whatsAppNumber,
        fullName,
        lastMessageTimeStamp: Date.now(),
      },
    };

    await docClient.send(new PutCommand(params));
  }

  async getUserById(userId) {
    const params = {
      TableName: TABLE_NAME,
      Key: { userId },
    };

    const { Item } = await docClient.send(new GetCommand(params));
    return Item;
  }

//   async getUserByWhatsAppNumber(whatsAppNumber) {
//     const params = {
//       TableName: TABLE_NAME,
//       IndexName: "whatsAppNumber-index",
//       KeyConditionExpression: "whatsAppNumber = :whatsAppNumber",
//       ExpressionAttributeValues: {
//         ":whatsAppNumber": whatsAppNumber,
//       },
//     };

//     const { Items } = await docClient.send(new QueryCommand(params));
//     return Items[0];
//   }

  async updateLastMessageTimeStamp(userId, timestamp) {
    const params = {
      TableName: TABLE_NAME,
      Key: { userId },
      UpdateExpression: "set lastMessageTimeStamp = :timestamp",
      ExpressionAttributeValues: {
        ":timestamp": timestamp,
      },
    };

    await docClient.send(new UpdateCommand(params));
  }
}
