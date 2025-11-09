using PetFoodVerifAI.DTOs;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PetFoodVerifAI.Services
{
    public class LLMService : ILLMService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;
        private readonly string _provider;
        private readonly string _apiVersion;

        public LLMService(IConfiguration configuration, HttpClient httpClient)
        {
            _httpClient = httpClient;
            _provider = configuration["LLM:Provider"]?.ToLower() ?? "anthropic";
            _apiKey = configuration["LLM:ApiKey"] ?? throw new InvalidOperationException("LLM API key is not configured. Set LLM:ApiKey in configuration.");
            _model = configuration["LLM:Model"] ?? GetDefaultModel(_provider);
            _apiVersion = configuration["LLM:ApiVersion"] ?? "2023-06-01";

            ConfigureHttpClient();
        }

        private void ConfigureHttpClient()
        {
            switch (_provider)
            {
                case "anthropic":
                case "claude":
                    _httpClient.BaseAddress = new Uri("https://api.anthropic.com/v1/");
                    _httpClient.DefaultRequestHeaders.Add("x-api-key", _apiKey);
                    _httpClient.DefaultRequestHeaders.Add("anthropic-version", _apiVersion);
                    break;

                case "openai":
                    _httpClient.BaseAddress = new Uri("https://api.openai.com/v1/");
                    _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
                    break;

                default:
                    throw new InvalidOperationException($"Unsupported LLM provider: {_provider}. Supported providers: anthropic, openai");
            }
        }

        private static string GetDefaultModel(string provider)
        {
            return provider switch
            {
                "anthropic" or "claude" => "claude-3-5-haiku-20241022",
                "openai" => "gpt-4o",
                _ => throw new InvalidOperationException($"Unknown provider: {provider}")
            };
        }

        public async Task<LlmAnalysisResult> AnalyzeIngredientsAsync(string ingredientsText, CreateAnalysisRequest petDetails)
        {
            var prompt = BuildPrompt(ingredientsText, petDetails);

            var responseContent = _provider switch
            {
                "anthropic" or "claude" => await CallAnthropicAsync(prompt),
                "openai" => await CallOpenAIAsync(prompt),
                _ => throw new InvalidOperationException($"Unsupported provider: {_provider}")
            };

            try
            {
                var cleanedContent = CleanMarkdownJson(responseContent);

                var result = JsonSerializer.Deserialize<LlmAnalysisResult>(cleanedContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return result ?? throw new InvalidOperationException("Failed to parse LLM response");
            }
            catch (JsonException ex)
            {
                throw new InvalidOperationException($"Failed to parse LLM response as JSON: {responseContent}", ex);
            }
        }

        private async Task<string> CallAnthropicAsync(string prompt)
        {
            var requestBody = new
            {
                model = _model,
                max_tokens = 2000,
                temperature = 0.3,
                system = "You are a veterinary nutritionist AI assistant specializing in pet food analysis. You provide factual, evidence-based recommendations prioritizing pet safety. Always respond with valid JSON only.",
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = prompt
                    }
                }
            };

            var jsonContent = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("messages", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"LLM API request failed with status {response.StatusCode}: {errorContent}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var anthropicResponse = JsonSerializer.Deserialize<AnthropicResponse>(responseContent);

            if (anthropicResponse?.Content == null || anthropicResponse.Content.Length == 0)
            {
                throw new InvalidOperationException("No response received from LLM API");
            }

            return anthropicResponse.Content[0].Text;
        }

        private async Task<string> CallOpenAIAsync(string prompt)
        {
            var requestBody = new
            {
                model = _model,
                messages = new[]
                {
                    new
                    {
                        role = "system",
                        content = "You are a veterinary nutritionist AI assistant specializing in pet food analysis. You provide factual, evidence-based recommendations prioritizing pet safety."
                    },
                    new
                    {
                        role = "user",
                        content = prompt
                    }
                },
                temperature = 0.3,
                max_tokens = 2000,
                response_format = new { type = "json_object" }
            };

            var jsonContent = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("chat/completions", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"LLM API request failed with status {response.StatusCode}: {errorContent}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var openAiResponse = JsonSerializer.Deserialize<OpenAIResponse>(responseContent);

            if (openAiResponse?.Choices == null || openAiResponse.Choices.Length == 0)
            {
                throw new InvalidOperationException("No response received from LLM API");
            }

            return openAiResponse.Choices[0].Message.Content;
        }

        private static string CleanMarkdownJson(string content)
        {
            var trimmed = content.Trim();
            
            if (trimmed.StartsWith("```"))
            {
                var firstNewLine = trimmed.IndexOf('\n');
                if (firstNewLine > 0)
                {
                    trimmed = trimmed.Substring(firstNewLine + 1);
                }
                
                if (trimmed.EndsWith("```"))
                {
                    trimmed = trimmed.Substring(0, trimmed.Length - 3);
                }
            }
            
            return trimmed.Trim();
        }

        private static string BuildPrompt(string ingredientsText, CreateAnalysisRequest petDetails)
        {
            return $@"Analyze the following pet food ingredients and provide a comprehensive assessment.

## INPUT INFORMATION:

**Pet Species:** {petDetails.Species}
**Pet Breed:** {petDetails.Breed}
**Pet Age:** {petDetails.Age} years
**Additional Information:** {(string.IsNullOrWhiteSpace(petDetails.AdditionalInfo) ? "None provided" : petDetails.AdditionalInfo)}

**Product Ingredients:**
{ingredientsText}

## YOUR TASK:

Analyze these ingredients and determine if this food is recommended for this specific pet. Consider:

### For Cats (if applicable):
- **Essential nutrients that MUST be present:** Taurine (critical), Arachidonic acid, Vitamin A (preformed), Arginine, high-quality animal protein
- **Toxic/Unacceptable ingredients:** Onions, garlic, chives, grapes, raisins, chocolate, caffeine, xylitol, alcohol, macadamia nuts
- **Questionable ingredients:** Excessive carbs/grains, low-quality protein fillers, artificial preservatives (BHA, BHT, ethoxyquin), unspecified by-products

### For Dogs (if applicable):
- **Essential nutrients:** Complete protein sources, essential fatty acids, vitamins, minerals with proper calcium/phosphorus ratio
- **Toxic/Unacceptable ingredients:** Onions, garlic (in significant amounts), grapes, raisins, chocolate, caffeine, xylitol, macadamia nuts, alcohol, avocado
- **Questionable ingredients:** Excessive grain fillers, generic ""meat meal"", artificial preservatives, excessive salt/sugars

### Additional Checks:
- Check for any allergens mentioned in Additional Information
- Ensure nutrition is appropriate for the pet's age (puppy/kitten vs adult vs senior)
- Consider breed-specific dietary needs
- Verify accommodation of any health conditions mentioned

## OUTPUT FORMAT (MUST BE VALID JSON):

{{
  ""IsRecommended"": true or false,
  ""Justification"": ""A comprehensive 2-4 sentence summary explaining your recommendation. Be specific about key strengths or concerns. Reference the pet's specific characteristics."",
  ""Concerns"": [
    {{
      ""Type"": ""unacceptable"" or ""questionable"",
      ""Ingredient"": ""specific ingredient name"",
      ""Reason"": ""clear explanation of why this is concerning""
    }}
  ]
}}

## DECISION RULES:
- Set IsRecommended = false if ANY unacceptable ingredients are present OR critical nutrients are missing OR ingredients conflict with health conditions/allergies
- Set IsRecommended = true if all essential nutrients are present, no unacceptable ingredients, and appropriate for the pet
- List EVERY problematic ingredient in Concerns array
- Use ""unacceptable"" for toxic ingredients or critical missing nutrients (e.g., missing taurine for cats, high amounts of grains for cats or xylitol for dogs)
- Use ""questionable"" for low-quality or suboptimal ingredients
- For missing critical nutrients, format as: Ingredient: ""Taurine (missing)"", Type: ""unacceptable""

Provide your analysis now as valid JSON only, with no additional text:";
        }

        private class AnthropicResponse
        {
            [JsonPropertyName("content")]
            public ContentBlock[]? Content { get; set; }
        }

        private class ContentBlock
        {
            [JsonPropertyName("text")]
            public string Text { get; set; } = string.Empty;
        }

        private class OpenAIResponse
        {
            [JsonPropertyName("choices")]
            public Choice[]? Choices { get; set; }
        }

        private class Choice
        {
            [JsonPropertyName("message")]
            public Message Message { get; set; } = new();
        }

        private class Message
        {
            [JsonPropertyName("content")]
            public string Content { get; set; } = string.Empty;
        }
    }
}

