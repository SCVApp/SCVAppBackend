import { Injectable } from '@nestjs/common';
import * as fcm from 'fcm-notification';

@Injectable()
export class NotificationService {
  private readonly FCM = new fcm(
    './src/certs/scvapp-704a1-firebase-adminsdk-ao353-38b3d1cf64.json',
  );
  constructor() {}

  sendNotification() {
    this.FCM.send(
      {
        notification: {
          title: 'Title of your push notification',
          body: 'Body of your push notification',
        },
        token:
          'fhX5ceqRScGsliKsVqbuYC:APA91bH-t_pduVcUfI70BLWKQKw8VtAavB07VThflecHWzbs3gbSwFoK1BpIdhb1V13FaIkPtEBJR2FGnukItgAQR8KyXC5ajLjcNS7Q6v_ZBTQf6g8E5lCZi7WnHrX90owNp725oYdf',
      },
      (err, response) => {
        if (err) {
          console.error('Error:', err);
        } else {
          console.log('Response:', response);
        }
      },
    );
  }
}
