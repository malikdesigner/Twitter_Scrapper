const puppeteer = require("puppeteer");
const fs = require("fs");


let tweetExtracted = [];

//Twitter
(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const navigationPromise = page.waitForNavigation();
  page.goto("https://twitter.com/explore");
  await page.waitForSelector('[placeholder="Search Twitter"]');

  const name = process.argv[2] || "Proximus";
  console.log(name);

  await page.type('[placeholder="Search Twitter"]', name);
  //  await page.click("")
  await page.waitForTimeout(1000);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2000);
  await page.waitForSelector(".css-1dbjc4n");
  //await autoScroll(page);
  await page.waitForTimeout(1000);
// for applying date filter for last three months
  await page.click('[data-testid="searchBoxOverflowButton"]');
  await page.waitForTimeout(1000);
  await page.waitForSelector(`[data-testid="advancedSearch-overflow"] `);
  await page.click(`[data-testid="advancedSearch-overflow"] `);
  await page.waitForTimeout(2000);
  await navigationPromise;
  await page.waitForSelector('[name="allOfTheseWords"]');
  await page.click('[name="allOfTheseWords"]');
  await page.$eval('[name="allOfTheseWords"]', (el) => (el.value = name));

  // selecting index of dropdown start here
  //month selecting current
  const monthSelect = await page.$("#SELECTOR_2");
  await page.evaluate((element) => {
    let today = new Date();
    var month = today.getMonth() + 1;

    if (element) {
      element.scrollIntoView();

      element.selectedIndex = month;
    }
    console.log(month);
  }, monthSelect);

  //day selecting current
  const daySelect = await page.$("#SELECTOR_3");
  await page.evaluate((element) => {
    let today = new Date();
    var day = today.getDate();
    if (element) {
      element.scrollIntoView();
      element.selectedIndex = day;
    }
  }, daySelect);

  //year selecting current
  const yearSelect = await page.$("#SELECTOR_4");
  //console.log("heee")
  await page.waitForSelector("#SELECTOR_4");
  await page.evaluate((element) => {
    let today = new Date();

    var year = today.getFullYear();
    if (element) {
      element.scrollIntoView();
      element.value = year;
    }
  }, yearSelect);

  //three month before filter
  //year
  const yearSelectB = await page.$("#SELECTOR_7");
  await page.evaluate((element) => {
    const from = new Date(new Date() - 2 * 30 * 24 * 60 * 60 * 1000);
    const [year] = [from.getFullYear()];
    if (element) {
      element.scrollIntoView();
      element.value = year;
    }
  }, yearSelectB);

  //month
  const monthSelectB = await page.$("#SELECTOR_5");
  await page.evaluate((element) => {
    const from = new Date(new Date() - 2 * 30 * 24 * 60 * 60 * 1000);
    const [month] = [from.getMonth() + 1];
    if (element) {
      element.scrollIntoView();
      element.selectedIndex = month;
    }
  }, monthSelectB);
  //day selecting
  const daySelectB = await page.$("#SELECTOR_6");
  await page.evaluate((element) => {
    const from = new Date(new Date() - 3 * 30 * 24 * 60 * 60 * 1000);
    const [date] = [from.getDate()];

    if (element) {
      element.scrollIntoView();
      element.selectedIndex = date;
    }
  }, daySelectB);
  // selecting index of dropdown end here

  await page.waitForSelector('[role="button"]');
  await page.click('[role="button"]');
  await page.waitForTimeout(10000);
  var prev = 0, cur = 1;


  //logic for getting tweets start here
  let flag = true;
  while (flag) {
    console.log(tweetExtracted.length);
    //console.log(tweetExtracted)
    flag = await tweetsExtractor(page, tweetExtracted);
    if (!flag) {
      break;
    }
    tweetExtracted = [...new Set([...tweetExtracted, ...flag])];
    cur = tweetExtracted.length;
    if (cur == prev) break;               // checking length of array 
    else {
      prev = cur;
    }
    await page.evaluate(() => window.scrollBy(0, 3000));
    await page.waitForTimeout(3000);
  }
  const data = JSON.stringify(tweetExtracted);
  fs.writeFile("user.json", data, (err) => {
    if (err) {
      throw err;
    }
    // console.log("JSON data is saved.");
  });

  //logic for getting tweets end here

  await browser.close();
})();

// extracting tweets after one scroll
async function tweetsExtractor(page, tweetExtracted) {
  let localTweet = [];

  const tweets = await page.$$("article div[lang]");
  //const user= await page.$$('article div[dir] span span');

  for (let index = 0; index < tweets.length; index++) {
    const element = tweets[index];
    const tweetText = await page.evaluate(
      (element) => element.textContent,
      element
      //console.log(element.children[index].textContent),
    );
    if (tweetText.length <= 1) {
      localTweet[localTweet.length - 1] += tweetText;
    } else {
      localTweet.push(tweetText);
    }
  }
  //console.table(localTweet)

  //console.log(tweets.length);
  const flag = tweets.length > 0 ? localTweet : false;

  return flag;
}
