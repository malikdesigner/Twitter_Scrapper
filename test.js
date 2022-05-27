const puppeteer =require("puppeteer");

(async()=>{
    const browser =await puppeteer.launch ({headless:false});
    const page=await browser.newPage();
    const navigationPromise=page.waitForNavigation();
    page.goto("https://twitter.com/explore");
    await page.waitForSelector('[placeholder="Search Twitter"]')
    await page.type('[placeholder="Search Twitter"]',"Proximus")
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);


     autoScroll(page)
    await browser.close();
})

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}