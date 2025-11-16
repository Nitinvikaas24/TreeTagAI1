import axios from 'axios';

export const getWikipediaInfo = async (scientificName) => {
  try {
    // Search for the plant article
    const searchResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        list: 'search',
        srsearch: scientificName,
        format: 'json',
        utf8: 1
      }
    });

    if (!searchResponse.data.query.search.length) {
      return { subtype: '', summary: '' };
    }

    const pageId = searchResponse.data.query.search[0].pageid;

    // Get the page content
    const contentResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        prop: 'extracts|categories',
        exintro: true,
        explaintext: true,
        pageids: pageId,
        format: 'json',
        utf8: 1
      }
    });

    const page = contentResponse.data.query.pages[pageId];
    const extract = page.extract;
    
    // Try to determine plant subtype from categories or content
    let subtype = '';
    if (page.categories) {
      const categoryNames = page.categories.map(cat => cat.title.toLowerCase());
      if (categoryNames.some(cat => cat.includes('tree'))) {
        subtype = 'Tree';
      } else if (categoryNames.some(cat => cat.includes('shrub'))) {
        subtype = 'Shrub';
      } else if (categoryNames.some(cat => cat.includes('flower'))) {
        subtype = 'Flower';
      } else if (categoryNames.some(cat => cat.includes('herb'))) {
        subtype = 'Herb';
      }
    }

    // If no subtype found in categories, try to find in content
    if (!subtype && extract) {
      const lowerExtract = extract.toLowerCase();
      if (lowerExtract.includes('tree')) {
        subtype = 'Tree';
      } else if (lowerExtract.includes('shrub')) {
        subtype = 'Shrub';
      } else if (lowerExtract.includes('flower')) {
        subtype = 'Flower';
      } else if (lowerExtract.includes('herb')) {
        subtype = 'Herb';
      }
    }

    return {
      subtype,
      summary: extract
    };

  } catch (error) {
    console.error('Wikipedia API error:', error);
    return { subtype: '', summary: '' };
  }
};