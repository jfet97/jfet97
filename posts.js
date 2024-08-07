const { XMLParser } = require('fast-xml-parser');
const fs = require("node:fs/promises");
const dayjs = require("dayjs");

const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

async function writeToFile(content) {
    await fs.writeFile("./README.md", content);
}

const FEED_URL = 'https://andreasimonecosta.dev/posts/index.xml';

async function fetchPosts() {
  const res = await fetch(FEED_URL, {
    headers: {
      "User-Agent": "GitHub README RSS",
    },
  });
  
  if(res.ok) {
    return res.text();
  } else {
    throw await res.text();
  }
}

async function parseXml(xml) {
  const parser = new XMLParser()
  return parser.parse(xml);
}

class Post {
  constructor(xmlItem) {
    if(!xmlItem.title || !xmlItem.link || !xmlItem.pubDate || !xmlItem.description) {
      throw new Error('Invalid XML item');
    }
    this.title = xmlItem.title;
    this.link = xmlItem.link;
    this.pubDate = xmlItem.pubDate;
    this.guid = xmlItem.guid;
    this.description = xmlItem.description;
  }
}

/**
 * Fetches and parses the RSS feed
 * @returns {Promise<Post[]>} List of posts
 * @throws {Error} If the XML is invalid
 */
async function getPosts() {
  const xml = await fetchPosts();
  const posts = await parseXml(xml);
  return posts.rss.channel.item.map(i => new Post(i));
}

/**
  * @param {Post[]} posts
  * @param {number} numOfPosts The number of posts to include in the README
  * @returns {string} The README content
*/
function generateReadme(posts, numOfPosts = 7) {
  const intro = `## Who is jfet97?

I'm Andrea 😄, a freelance software developer with strong skills in JavaScript and TypeScript. Additionally, I'm a huge fan of functional programming and I extensively use libraries like [Effect](https://effect.website/) in my daily work.

### I'm a student

At the moment, I'm a master's student in [theoretical CS](https://didattica.di.unipi.it/laurea-magistrale-in-informatica/curricula/curriculum-software-programming-principles-and-technologies/) at the University of Pisa. I'm strongly drawn to the theoretical aspects of Computer Science. Lately, I have been delving into type systems.

### I'm an educator

I also have a strong passion for sharing my knowledge through articles, videos, and training courses. You can find more by browsing through [my website](https://andreasimonecosta.dev/)!

## Who cares about jfet97?

My grandma 👵🏻❤️

`;

  const postsText = `## My last ${numOfPosts} articles

${
  posts
  .slice(0, numOfPosts)
  .map((item) => ({ ...item, link: item.link.replace("utm_source=rss", "utm_source=github_profile") }))
  .map((item, index) => `${index + 1}. [${item.title}](${item.link}) on ${dayjs(item.pubDate).format("YYYY-MM-DD")}`)
  .join("\n")
}
`;

  return intro + postsText;
}

async function main() {
  const posts = await getPosts();
  const content = generateReadme(posts, 7);
  await writeToFile(content);
}

main().then(() => console.log("done")).catch(console.error);