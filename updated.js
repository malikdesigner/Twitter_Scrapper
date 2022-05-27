const puppeteer = require("puppeteer");
const es =require("./es")
const fs = require("fs");


let tweetExtracted = [];
const hashesArray = [];
const base64Encoder = (data) => {
  //console.log(data)
  return Buffer.from(JSON.stringify(data)).toString('base64')
  
};

//Twitter
(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const navigationPromise = page.waitForNavigation();
  page.goto("https://twitter.com/explore");
  await page.waitForSelector('[placeholder="Search Twitter"]');

  const keyword = process.argv[2] || "Proximus";
  console.log(keyword);

  await page.type('[placeholder="Search Twitter"]', keyword);
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

//   const writeResultsToJsonFile = (dir = './', fileName = `${keyword}.json`, fileData = tweetExtracted) => {
//     fs.writeFileSync(dir.concat(fileName), JSON.stringify(fileData, null, 2))
//   }
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
    flag = await tweetsExtractor(page, tweetExtracted);
    // console.log(details)
     await page.evaluate(() => window.scrollBy(0, 5000));
     await page.waitForTimeout(4000);
     cur = tweetExtracted.length;
     if (cur == prev) break;               // checking length of array 
     else {
       prev = cur;
     }
     console.log(tweetExtracted)


  }
  // Converting into JSON file
  // inserting into elastic search
  await es
          .bulkIndex(tweetExtracted, "twitter")
          .then((response) => {
            console.info(`Indexed ${response.body.items.length}`);
            if (response.body.errors) {
              response.body.items.forEach((item, _in) => {
                if (item.index.error) {
                  console.error(tweetExtracted[_in]);
                  console.error(
                    `Error Indexing ${JSON.stringify(
                      item.index.error,
                      null,
                      "\t"
                    )}`
                  );
                }
              });
            }
          })
          .catch((err) => {
            console.error(err);
          });
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
    let names = await page.$$('a div div[dir="auto"] span span.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0')
    let nameID = await page.$$('a div[dir="ltr"] .css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0')
    let posts = await page.$$('.css-901oao.r-1nao33i.r-37j5jr.r-a023e6.r-16dba41.r-rjixqe.r-bcqeeo.r-bnwqim.r-qvutc0')
    let date = await page.$$("a time");
    let image =await page.$$('div.css-1dbjc4n.r-1p0dtai.r-1loqt21.r-1d2f490.r-u8s1d.r-zchlnj.r-ipm5af')
    
    //getting text from each element
    const pageElementEvaluator = async (element) => page.evaluate(
        (element) => element && element.textContent ? element.textContent : 'NA',
        element
      );
      const imageVideoURL = async (element) => page.evaluate(
    
        (element) => element && element.getAttribute('src') ? element.getAttribute('src') : 'NA',
        element
      );
      // iterate through the post on the display
      for (let i = 0; i < posts.length; i++) {
        const elementAuthor = names[i];
        const elementID = nameID[i];
        const elementPost = posts[i];
        const elementDate = date[i];
        const elementImg =image[i]
       
        const dateTime = await pageElementEvaluator(elementDate);
        const author = await pageElementEvaluator(elementAuthor);
        const imgVidUrl=await imageVideoURL(elementImg)
        const twitterID = await pageElementEvaluator(elementID);
        const post = await pageElementEvaluator(elementPost);
    
          const data = { author, twitterID, dateTime, post,imgVidUrl};
          const hashedData = base64Encoder(data);
          //console.log(hashedData)
          if (hashesArray.indexOf(hashedData) === -1) {
            hashesArray.push(hashedData)
            tweetExtracted.push(data)
            //console.log(details);
          }
        
      }
      //console.log(details)
      return tweetExtracted;
}

