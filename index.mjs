import axios from 'axios';
import translatte from 'translatte';
import { UserDao } from './dao/userDao.mjs';
import { MessageDao } from './dao/messageDao.mjs';

const userDao = new UserDao();
const messageDao = new MessageDao();

export const handler = async (event) => {
  // Log the entire incoming event
  console.log('Received webhook event:', JSON.stringify(event, null, 2));

  if (event.queryStringParameters) {
    // Register the webhook
    const queryParams = event.queryStringParameters;
    const verify_token = process.env.VERIFY_TOKEN;

    // Parse params from the webhook verification request
    let mode = queryParams["hub.mode"];
    let token = queryParams["hub.verify_token"];
    let challenge = queryParams["hub.challenge"];

    // Check if a token and mode were sent
    if (mode && token) {
      // Check the mode and token sent are correct
      if (mode === "subscribe" && token === verify_token) {
        console.log("WEBHOOK_VERIFIED");
        return {
          statusCode: 200,
          body: challenge,
        };
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        return {
          statusCode: 403,
        };
      }
    }
  } else {
    const token = process.env.WHATSAPP_TOKEN;
    
    // Log the parsed body
    const body = JSON.parse(event.body);
    console.log('Parsed webhook body:', JSON.stringify(body, null, 2));

    if (body.object === 'whatsapp_business_account' && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
      const change = body.entry[0].changes[0].value;
      const userId = change.metadata.phone_number_id;
      const whatsAppNumber = change.messages[0].from;
      const fullName = change.contacts[0].profile.name;
      const messageId = change.messages[0].id;
      const messageType = change.messages[0].type;
      const messageContent = change.messages[0].text.body;

      // Step 3: Check if user exists and update or create
      const existingUser = await userDao.getUserById(userId);
      const currentTimestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

      if (existingUser) {
        await userDao.updateLastMessageTimeStamp(userId, currentTimestamp);
      } else {
        await userDao.createUser(userId, whatsAppNumber, fullName);
      }

      // Step 4: Save received message
      await messageDao.createMessage(userId, messageId, whatsAppNumber, messageType, 'inbound', messageContent);

      // Step 5: Translate message
      const translate = await translatte(messageContent, { to: "hi" });
      console.log('Translated text:', translate.text);

      // Step 6: Save translated message
      const outboundMessageId = `outbound_${Date.now()}`;
      await messageDao.createMessage(userId, outboundMessageId, whatsAppNumber, 'text', 'outbound', translate.text);

      // Step 7: Send translated message
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/v21.0/${userId}/messages?access_token=${token}`,
        data: {
          messaging_product: "whatsapp",
          to: whatsAppNumber,
          text: { body: translate.text },
        },
        headers: { "Content-Type": "application/json" },
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Message processed successfully' }),
      };
    }
  }

  // // Default response if no conditions are met
  // return {
  //   statusCode: 200,
  //   body: JSON.stringify('Hello from Lambda!'),
  // };
};
