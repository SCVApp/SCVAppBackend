import { Injectable } from '@nestjs/common';
import { connect, ImapSimple, Message } from 'imap-simple';
import { convert } from 'html-to-text';
import { simpleParser } from 'mailparser';
import { MailDto } from './mail.dto';
import { createTransport } from 'nodemailer';

@Injectable()
export class MailService {
  READ_MAIL_CONFIG = {
    imap: {
      user: process.env.EMAIL_ID,
      password: process.env.EMAIL_PASS,
      host: 'outlook.office365.com',
      port: 993,
      authTimeout: 10000,
      tls: true,
    },
  };
  SEND_MAIL_CONFIG = {
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASS,
    },
    requireTLS: true,
  };

  async readMail(): Promise<MailDto[]> {
    try {
      const connection = await connect(this.READ_MAIL_CONFIG);
      const box = await connection.openBox('INBOX');
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT'],
        markSeen: true,
      };
      const results = await connection.search(searchCriteria, fetchOptions);
      let getedMails: MailDto[] = [];
      for (let result of results) {
        let part = result.parts.find((p) => p.which === 'TEXT');
        let header = result.parts.find((p) => p.which === 'HEADER');
        if (part && header) {
          let decodedEmail = null;
          try {
            decodedEmail = await simpleParser(convert(part.body));
          } catch (e) {
            decodedEmail = await simpleParser(part.body);
          }
          console.log(decodedEmail);
          if (decodedEmail.text !== '') {
            let sender: string = this.getSender(header.body.from[0] || '');
            let zadeva: string =
              decodedEmail.text || this.getHeaderLinesFromMail(decodedEmail);
            zadeva = zadeva.trim();
            let naslov: string = header.body.subject[0] || '';
            let datum: Date = new Date(header.body.date[0] || '');
            let newMail: MailDto = {
              sender,
              zadeva,
              naslov,
              datum,
            };
            getedMails.push(newMail);
          }
        }
      }
      connection.end();
      return getedMails;
    } catch (e) {
      console.log(e);
    }
  }

  async sendMail() {
    const transporter = createTransport(this.SEND_MAIL_CONFIG);

    await transporter.sendMail({
      to: 'urban.krepel@scv.si',
      subject: 'Test',
      text: 'Testing',
    });
  }

  private getSender(sender: string): string {
    let f = sender.search('<');
    let e = sender.search('>');
    if (f <= -1 || e <= -1) return sender;
    return sender.substring(f + 1, e);
  }

  private getHeaderLinesFromMail(mail): string {
    let headerLines = mail.headerLines;
    if (headerLines.length < 1) return '';
    return mail.headerLines
      .map((line) => {
        return line.line;
      })
      .join('\n');
  }
}

// {
//   attachments: [],
//   headers: Map(0) {},
//   headerLines: [ { key: '', line: 'test1234567890' } ],
//   html: false
// }
// {
//   sender: 'urban.krepel@scv.si',
//   zadeva: '',
//   naslov: 'test',
//   datum: 2022-06-10T07:19:38.000Z
// }
