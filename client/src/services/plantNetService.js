import EnvConfig from "../config/env.js";

// PlantNet API Service
class PlantNetService {
  constructor() {
    this.apiKey = EnvConfig.PLANTNET_API_KEY;
    this.baseUrl = EnvConfig.PLANTNET_API_URL;
    this.timeout = EnvConfig.API_TIMEOUT;
  }

  async identifyPlant(images, organs = ["leaf"]) {
    if (!this.apiKey) {
      throw new Error(
        "PlantNet API key not configured. Please add VITE_PLANTNET_API_KEY to your .env file."
      );
    }

    try {
      const formData = new FormData();

      // Add images to form data
      images.forEach((imageBlob, index) => {
        formData.append("images", imageBlob, `plant-image-${index}.jpg`);
        formData.append("organs", organs[index] || "leaf");
      });

      // Add modifiers
      formData.append("modifiers", "crops");
      formData.append("include-related-images", "false");
      formData.append("no-reject", "false");
      formData.append("nb-results", "10");
      formData.append("lang", "en");
      formData.append("type", "kt");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${this.baseUrl}/identify/all?api-key=${this.apiKey}`,
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
          headers: {
            // Don't set Content-Type for FormData, browser will set it with boundary
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `PlantNet API error (${response.status}): ${errorData}`
        );
      }

      const data = await response.json();

      // Process and format the results
      return this.formatResults(data);
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(
          "Request timeout - PlantNet API took too long to respond"
        );
      }
      console.error("PlantNet API error:", error);
      throw error;
    }
  }

  formatResults(data) {
    if (!data || !data.results || data.results.length === 0) {
      return {
        species: [],
        confidence: 0,
        message:
          "No plants identified. Try taking clearer photos or different angles.",
      };
    }

    const species = data.results.map((result, index) => ({
      id: `plantnet-${index}`,
      scientificName: result.species?.scientificName || "Unknown species",
      commonNames: result.species?.commonNames || [],
      family: result.species?.family?.scientificName || "Unknown family",
      genus: result.species?.genus?.scientificName || "Unknown genus",
      confidence: Math.round(result.score * 100) / 100,
      confidencePercentage: Math.round(result.score * 100),
      images:
        result.images?.map((img) => ({
          url: img.url?.m || img.url?.s || img.url?.o,
          author: img.author,
          license: img.license,
          organ: img.organ,
        })) || [],
      gbifId: result.gbif?.id,
      iucnStatus: result.iucn?.category,
      wikiUrl: result.species?.commonNames?.[0]
        ? `https://en.wikipedia.org/wiki/${encodeURIComponent(
            result.species.commonNames[0]
          )}`
        : null,
    }));

    const topResult = species[0];
    const averageConfidence =
      species.reduce((sum, s) => sum + s.confidence, 0) / species.length;

    return {
      species,
      confidence: averageConfidence,
      topMatch: topResult,
      totalResults: species.length,
      apiSource: "PlantNet",
      timestamp: new Date().toISOString(),
    };
  }

  // Get plant information by scientific name
  async getPlantInfo(scientificName) {
    // This would typically query additional databases or APIs
    // For now, return basic structure
    return {
      scientificName,
      commonNames: [],
      description: `Information about ${scientificName}`,
      careInstructions: "General plant care instructions",
      uses: [],
      habitat: "Various habitats",
      source: "PlantNet Database",
    };
  }

  // Check if API key is valid
  async validateApiKey() {
    if (!this.apiKey) {
      return false;
    }

    try {
      // Make a simple request to test the API key
      const response = await fetch(`${this.baseUrl}/projects`, {
        headers: {
          "Api-Key": this.apiKey,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("API key validation failed:", error);
      return false;
    }
  }
}

export default PlantNetService;
