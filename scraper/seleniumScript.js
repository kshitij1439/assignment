const proxyChain = require('proxy-chain');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

async function fetchTrendingTopics() {
  const proxyUrl = 'http://username:password@us-ca.proxymesh.com:31280';
  //proxyurl here

  const newProxyUrl = await proxyChain.anonymizeProxy(proxyUrl);

  const options = new chrome.Options();
  options.addArguments(`--proxy-server=${newProxyUrl}`);
  options.addArguments('--start-maximized'); 

  let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  try {
    await driver.get('https://api.ipify.org/?format=json');

    const bodyElement = await driver.wait(until.elementLocated(By.tagName('body')), 15000);
    const jsonResponse = await bodyElement.getText();
    const publicIP = JSON.parse(jsonResponse).ip; 
    console.log(`Public IP Address: ${publicIP}`);

    const cookiesPath = 'cookies.json';
    if (fs.existsSync(cookiesPath)) {
      const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'));
      await driver.get('https://x.com');

      for (let cookie of cookies) {
        await driver.manage().addCookie(cookie);
      }

      await driver.navigate().refresh();

      await driver.wait(until.urlContains('https://x.com'), 15000); 
    } else {
      await driver.get('https://x.com/login');

      const usernameField = await driver.wait(until.elementLocated(By.name('text')), 15000);
      await usernameField.sendKeys('@username'); // Replace with your username
      await driver.findElement(By.xpath("//span[contains(text(), 'Next')]")).click();

      const passwordField = await driver.wait(until.elementLocated(By.name('password')), 15000);
      await passwordField.sendKeys('password'); // Replace with your password
      await driver.findElement(By.xpath("//span[contains(text(), 'Log in')]")).click();

      await driver.wait(until.urlContains('https://x.com/home'), 15000);

      const cookies = await driver.manage().getCookies();
      fs.writeFileSync(cookiesPath, JSON.stringify(cookies));
    }

    await driver.get('https://x.com/explore');

    await driver.wait(until.elementLocated(By.xpath("//div[contains(@data-testid, 'trend')]")), 15000);

    const trendElements = await driver.findElements(By.xpath("//div[contains(@data-testid, 'trend')]//span"));
    let trends = [];
    for (let i = 0; i < Math.min(5, trendElements.length); i++) {
      trends.push(await trendElements[i].getText());
    }

    console.log(`Trending Topics: ${JSON.stringify(trends, null, 2)}`);
    console.log(`Fetched from Public IP: ${publicIP}`);
    
    return { trends, ipAddress: publicIP, dateTime: new Date().toISOString() };

  } catch (error) {
    console.error('Error:', error);
    return { error: 'An error occurred during scraping.' };
  } finally {
    await driver.quit();
  }
}

module.exports.run = fetchTrendingTopics;
