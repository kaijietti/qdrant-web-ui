import { OpenapiAutocomplete } from "autocomplete-openapi/src/autocomplete";

export const Autocomplete = async (monaco, qdrantClient) => {

  let response = await fetch(import.meta.env.BASE_URL + "./openapi.json");
  let openapi = await response.json();

  let collections = [];
  try {
    collections = (await qdrantClient.getCollections()).collections.map((c) => c.name);
  } catch (e) {
    console.error(e);
  }
  let visualize = {
    "post": {
      "tags": [
        "points"
      ],
      "summary": "Scroll points",
      "description": "Scroll request - paginate over all points which matches given filtering condition",
      "operationId": "scroll_points",
      "requestBody": {
        "description": "Pagination and filter parameters",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/FilterRequest"
            }
          }
        }
      },
      "parameters": [
        {
          "name": "collection_name",
          "in": "path",
          "description": "Name of the collection to retrieve from",
          "required": true,
          "schema": {
            "type": "string"
          }
        },
        {
          "name": "consistency",
          "in": "query",
          "description": "Define read consistency guarantees for the operation",
          "required": false,
          "schema": {
            "$ref": "#/components/schemas/ReadConsistency"
          }
        }
      ],
      "responses": {
        "default": {
          "description": "error",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "4XX": {
          "description": "error",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "200": {
          "description": "successful operation",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "time": {
                    "type": "number",
                    "format": "float",
                    "description": "Time spent to process this request"
                  },
                  "status": {
                    "type": "string",
                    "enum": [
                      "ok"
                    ]
                  },
                  "result": {
                    "$ref": "#/components/schemas/ScrollResult"
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  let FilterRequest = {
    "description": "Filter request",
    "type": "object",
    "properties": {
      "limit": {
        "description": "Page size. Default: 10",
        "type": "integer",
        "format": "uint",
        "minimum": 1,
        "nullable": true
      },
      "filter": {
        "description": "Look only for points which satisfies this conditions. If not provided - all points.",
        "anyOf": [
          {
            "$ref": "#/components/schemas/Filter"
          },
          {
            "nullable": true
          }
        ]
      },
      "vector_name": {
        "description": "Vector field name",
        "type": "string",
        "nullable": true
      },
      "color_by": {
        "description": "Color points by this field",
        "type": "string",
        "nullable": true
      }
    }
  };
  openapi.components.schemas.FilterRequest = FilterRequest;
  openapi.paths["/collections/{collection_name}/points/visualize"] = visualize;


  let autocomplete = new OpenapiAutocomplete(openapi, collections);

  return {
    provideCompletionItems: (model, position) => {

      // Reuse parsed code blocks to avoid parsing the same code block multiple times
      let selectedCodeBlock = monaco.selectedCodeBlock;

      if (!selectedCodeBlock) {
        return { suggestions: [] };
      }
      let relativeLine = position.lineNumber - selectedCodeBlock.blockStartLine;

      if (relativeLine < 0) {
        // Something went wrong
        return { suggestions: [] };
      }

      if (relativeLine > 0) {
        // Autocomplete for request body
        let requestLines = selectedCodeBlock.blockText.split(/\r?\n/);

        let lastLine = requestLines[relativeLine].slice(0, position.column);

        let requestBodyLines = requestLines.slice(0, relativeLine);

        requestBodyLines.push(lastLine);

        let requestBody = requestBodyLines.join("\n");

        let suggestions = autocomplete.completeRequestBody("POST collections/collection_name/points/visualize", requestBody);
        suggestions = suggestions.map((s) => {
          return {
            label: s,
            kind: 17,
            insertText: s,
          };
        });

        return { suggestions: suggestions };
      }
    },
  }
};
