const BASE_URL = 'http://localhost:4000';
const TEST_SERIES_URL = 'https://www.webtoons.com/en/canvas/fragments-of-the-wounds-kizu-no-kakera/list?title_no=972745';
const TEST_ARTIST_URL = 'https://www.webtoons.com/p/community/en/u/marmae';
const TEST_CREATOR_ID = '8cmhlp';

async function testAPI(name, url) {
  console.log(`\n📡 Testing ${name}...`);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.success) {
      console.log(`✅ Success!`);
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Failed:`, data.error);
    }
  } catch (error) {
    console.log(`❌ Error:`, error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing Webtoon API\n');
  
  await testAPI('Webtoon Stats (Series)', 
    `${BASE_URL}/api/webtoon-stats?url=${encodeURIComponent(TEST_SERIES_URL)}`);
  
  await testAPI('Artist Stats', 
    `${BASE_URL}/api/artist-stats?url=${encodeURIComponent(TEST_ARTIST_URL)}`);
  
  await testAPI('Creator Titles (API)',
    `${BASE_URL}/api/creator-titles?creatorId=${TEST_CREATOR_ID}`);

  console.log('\n✨ Tests complete!');
}

runTests();