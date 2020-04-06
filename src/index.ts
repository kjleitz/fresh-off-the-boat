import playwright from 'playwright';
import yargs from 'yargs';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';
import twilio from 'twilio';

dotenv.config();

const DEFAULT_TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const DEFAULT_TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const DEFAULT_TO_NUMBER = process.env.TO_NUMBER;
const DEFAULT_FROM_NUMBER = process.env.FROM_NUMBER;

const acctSidOptions = [
  's',
  'sid',
  'acct',
  'account',
  'acctSid',
  'acct-sid',
  'accountSid',
  'account-sid',
  'twilioAcctSid',
  'twilio-acct-sid',
  'twilioAccountSid',
  'twilio-account-sid',
] as const;

const authTokenOptions = [
  't',
  'auth',
  'token',
  'authToken',
  'auth-token',
  'twilioAuth',
  'twilio-auth',
  'twilioToken',
  'twilio-token',
  'twilioAuthToken',
  'twilio-auth-token',
] as const;

const toNumberOptions = [
  'to',
] as const;

const fromNumberOptions = [
  'from',
  'twilioNumber',
  'twilio-number',
  'twilioPhone',
  'twilio-phone',
  'twilioPhoneNumber',
  'twilio-phone-number',
] as const;

const { argv } = yargs.options({
  twilioAccountSid: {
    type: 'string',
    demandOption: !DEFAULT_TWILIO_ACCOUNT_SID,
    alias: acctSidOptions,
  },
  twilioAuthToken: {
    type: 'string',
    demandOption: !DEFAULT_TWILIO_AUTH_TOKEN,
    alias: authTokenOptions,
  },
  toNumber: {
    type: 'string',
    demandOption: !DEFAULT_TO_NUMBER,
    alias: toNumberOptions,
  },
  fromNumber: {
    type: 'string',
    demandOption: !DEFAULT_FROM_NUMBER,
    alias: fromNumberOptions,
  },
});

const userDataDir = path.resolve(__dirname, '..', 'tmp', 'userData');
const twilioAccountSid = (argv.twilioAccountSid || DEFAULT_TWILIO_ACCOUNT_SID || '');
const twilioAuthToken = (argv.twilioAuthToken || DEFAULT_TWILIO_AUTH_TOKEN || '');
const toNumber = (argv.toNumber || DEFAULT_TO_NUMBER || '');
const fromNumber = (argv.fromNumber || DEFAULT_FROM_NUMBER || '');

let twilioClient: twilio.Twilio;
let lastSentSms: Date;
const sendSms = (text: string): void => {
  const now = new Date();
  if (lastSentSms && lastSentSms.getTime() > (now.getTime() - 300000)) return;

  lastSentSms = now;
  twilioClient = twilioClient || twilio(twilioAccountSid, twilioAuthToken);
  const normalPhone = (phone: string) => `+1${phone.replace(/\D/g, '').replace(/^1/, '')}`;
  twilioClient.messages.create({
    body: text,
    to: normalPhone(toNumber),
    from: normalPhone(fromNumber),
  });
}

const waitForAvailability = (page: playwright.Page, callback: (availabilitiesInfo: string[]) => void): void => {
  setInterval(() => {
    page.reload({
      waitUntil: 'domcontentloaded',
    }).then(() => {
      page.$$eval('li.ufss-date-select-toggle-container', (elements: HTMLElement[]) => {
        return Array.from(elements).filter((li) => {
          const text = (li && li.innerText) || 'not available';
          console.log(text);
          return !text.match(/not available/i);
        }).map(li => li.innerText);
      }).then((availabilities) => {
        if (availabilities.length) callback(availabilities);
      });
    })
  }, 30000);
};

playwright.chromium.launchPersistentContext(userDataDir, {
  headless: false,
}).then((browser) => {
  browser.newPage().then((page) => {
    page.goto('https://www.amazon.com/signout').then(() => {
      const input = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      input.question("Please sign into Amazon. Press 'enter' once you've signed in.", () => {
        input.close();
        console.log("Sweeeeeet. Starting...");
        page.goto('https://www.amazon.com').then(() => {
          page.click('a#nav-cart').then(() => {
            page.click('input[value="Proceed to checkout"]').then(() => {
              page.click('a[name="proceedToCheckout"]').then(() => {
                page.waitForRequest(/shipoptionselect/).then(() => {
                  waitForAvailability(page, (availabilityInfo) => {
                    availabilityInfo.forEach((info) => {
                      console.log("FOUND ONE!");
                      console.log(info);
                    });
                    if (availabilityInfo.length) {
                      sendSms(`AVAILABLE AMAZON FRESH DELIVERIES:\n\n${availabilityInfo.join('\n\n')}`);
                      page.screenshot({ path: `proof/amazon-found-availabilities-${new Date().getTime()}.png` })
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
