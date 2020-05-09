require('dotenv').config();
import express from 'express';
const app = express();
const port = process.env.PORT || 3000;
import { getLinkedinProfileDetails, setupScraper, checkIfLoggedIn } from '../scraper/linkedin';

console.log(`Server setup: Setting up...`);

(async () => {
  try {
    // Setup the headless browser before the requests, so we can re-use the Puppeteer session on each request
    // Resulting in fast scrapes because we don't have to launch a headless browser anymore
    const { page } = await setupScraper()

    // An endpoint to determine if the scraper is still loggedin into LinkedIn
    app.get('/status', async (req, res) => {
      const isLoggedIn = await checkIfLoggedIn(page)

      if (isLoggedIn) {
        res.json({ status: 'success', message: 'Still logged in into LinkedIn.' })
      } else {
        res.json({ status: 'fail', message: 'We are logged out of LinkedIn, or our logged in check is not working anymore.' })
      }
    })

    app.get('/', async (req, res) => {
      const urlToScrape = req.query.url as string;

      if (urlToScrape?.includes('linkedin.com/')) {
        const linkedinProfileDetails = await getLinkedinProfileDetails(page, urlToScrape)
        res.json(linkedinProfileDetails)
      } else {
        res.json({
          message: 'Missing the url parameter. Or given URL is not an LinkedIn URL.'
        })
      }
    })
  } catch (err) {
    console.log('Error during setup')
    console.log(err)

    app.get('/', async (req, res) => {
      res.json({
        message: 'An error occurred',
        error: (err.message) ? err.message : null
      })
    })
  }

  app.listen(port, () => console.log(`Server setup: All done. Listening on port ${port}!`))

})()
