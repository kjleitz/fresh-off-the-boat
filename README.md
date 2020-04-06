# fresh off the boat

can't find available times for your amazon fresh delivery because of a global pandemic? `fresh-off-the-boat` will keep checking and send a text message to you when there are available days/times for delivery.

## instructions

- fill your Amazon Fresh cart with all your delicious groceries
- create a twilio account and add/purchase a phone number
- install `yarn`
- `git clone https://github.com/kjleitz/fresh-off-the-boat`
- `cd fresh-off-the-boat`
- `touch .env`
- add the following to the `.env` file (these can, alternatively, be supplied/overridden with command line args to `yarn start` when you run it later):

```
TWILIO_ACCOUNT_SID=<your account sid from twilio>
TWILIO_AUTH_TOKEN=<your auth token from twilio>
TO_NUMBER=<your phone number>
FROM_NUMBER=<the phone number you added to twilio>
```

- `yarn install`
- `yarn start` (or, if you skipped the `.env` steps, `yarn start --sid=<your twilio acct sid> --token=<your twilio auth token> --to=<your phone> --from=<twilio number>`)
- once chrome opens, log into amazon, then come back to the terminal and hit "enter" at the prompt
- wait for a text message to tell you there's an availability!

## notes

Amazon might log you out after a couple hours. Just ctrl+C to stop the program and `yarn start` again, log in, go back to the terminal, hit enter, and you're good to go. I'll work on automating the login process, but for the moment it's easier this way so that Amazon doesn't think you're a bot.

## contributing

yeah, pull requests welcome

## license

MIT
