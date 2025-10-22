✅ Using cached profile
AppLayout.tsx:111 👤 AppLayout - Profile loaded: Object
app:1 Access to fetch at 'http://localhost:8000/api/optimized/events' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/optimized/events:1  Failed to load resource: net::ERR_FAILED
registryService.ts:251 Server endpoint failed, falling back to original method: TypeError: Failed to fetch
    at getAllRegistryEvents (registryService.ts:237:30)
    at getGlobalActivity (activityService.ts:365:34)
    at fetchActivities (ActivityFeed.tsx:131:35)
    at ActivityFeed.tsx:111:5
    at commitHookEffectListMount (chunk-KC4I5BQM.js?v=741298f3:16915:34)
    at commitPassiveMountOnFiber (chunk-KC4I5BQM.js?v=741298f3:18156:19)
    at commitPassiveMountEffects_complete (chunk-KC4I5BQM.js?v=741298f3:18129:17)
    at commitPassiveMountEffects_begin (chunk-KC4I5BQM.js?v=741298f3:18119:15)
    at commitPassiveMountEffects (chunk-KC4I5BQM.js?v=741298f3:18109:11)
    at flushPassiveEffectsImpl (chunk-KC4I5BQM.js?v=741298f3:19490:11)
app:1 Access to fetch at 'http://localhost:8000/api/optimized/events' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/optimized/events:1  Failed to load resource: net::ERR_FAILED
registryService.ts:251 Server endpoint failed, falling back to original method: TypeError: Failed to fetch
    at getAllRegistryEvents (registryService.ts:237:30)
    at loadEvents (BrowseEvents.tsx:63:38)
    at BrowseEvents.tsx:193:5
    at commitHookEffectListMount (chunk-KC4I5BQM.js?v=741298f3:16915:34)
    at commitPassiveMountOnFiber (chunk-KC4I5BQM.js?v=741298f3:18156:19)
    at commitPassiveMountEffects_complete (chunk-KC4I5BQM.js?v=741298f3:18129:17)
    at commitPassiveMountEffects_begin (chunk-KC4I5BQM.js?v=741298f3:18119:15)
    at commitPassiveMountEffects (chunk-KC4I5BQM.js?v=741298f3:18109:11)
    at flushPassiveEffectsImpl (chunk-KC4I5BQM.js?v=741298f3:19490:11)
    at flushPassiveEffects (chunk-KC4I5BQM.js?v=741298f3:19447:22)
requestManager.ts:119 ⏳ [RequestManager] Deduplicating request: registry:get-total-events:...
registryService.ts:261 📊 Total events in registry: 23
registryService.ts:269 Fetching events 1 to 10...
registryService.ts:261 📊 Total events in registry: 23
registryService.ts:269 Fetching events 1 to 10...
requestManager.ts:119 ⏳ [RequestManager] Deduplicating request: registry:get-events-range:0x01000000000000000000000000000000...
registryService.ts:155 📦 get-events-range(1, 10) raw response: {
  "type": "(response (tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint)) UnknownType)",
  "value": {
    "type": "(tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint))",
    "value": {
      "end": {
        "type": "uint",
        "value": "10"
      },
      "events": {
        "type": "(list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))",
        "value": [
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-44---regular-1760864335704"
                },
                "contract-name": {
                  "type": "(string-ascii 38)",
                  "value": "summer-fest-44---regular-1760864335704"
                },
                "event-id": {
                  "type": "uint",
                  "value": "1"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "103324"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 40)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 40)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-2030---regular-1760865905401"
                },
                "contract-name": {
                  "type": "(string-ascii 40)",
                  "value": "summer-fest-2030---regular-1760865905401"
                },
                "event-id": {
                  "type": "uint",
                  "value": "2"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "103330"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-45---regular-1760873879263"
                },
                "contract-name": {
                  "type": "(string-ascii 38
registryService.ts:165 Tuple value: Object
registryService.ts:181 Found 10 items in events list
registryService.ts:194 Event 0 data: Object
registryService.ts:211 ✅ Added event 1: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-44---regular-1760864335704.summer-fest-44---regular-1760864335704
registryService.ts:194 Event 1 data: Object
registryService.ts:211 ✅ Added event 2: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-2030---regular-1760865905401.summer-fest-2030---regular-1760865905401
registryService.ts:194 Event 2 data: Object
registryService.ts:211 ✅ Added event 3: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-45---regular-1760873879263.summer-fest-45---regular-1760873879263
registryService.ts:194 Event 3 data: Object
registryService.ts:211 ✅ Added event 4: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-60---regular-1760877756240.summer-fest-60---regular-1760877756240
registryService.ts:194 Event 4 data: Object
registryService.ts:211 ✅ Added event 5: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest---regular-1760879040748.summer-fest---regular-1760879040748
registryService.ts:194 Event 5 data: Object
registryService.ts:211 ✅ Added event 6: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-335---regular-1760879424709.summer-fest-335---regular-1760879424709
registryService.ts:194 Event 6 data: Object
registryService.ts:211 ✅ Added event 7: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760879653136.summer-fest-2030---regular-1760879653136
registryService.ts:194 Event 7 data: Object
registryService.ts:211 ✅ Added event 8: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3345---regular-1760880140001.summer-fest-3345---regular-1760880140001
registryService.ts:194 Event 8 data: Object
registryService.ts:211 ✅ Added event 9: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760881234897.summer-fest-2030---regular-1760881234897
registryService.ts:194 Event 9 data: Object
registryService.ts:211 ✅ Added event 10: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3312---regular-1760881456705.summer-fest-3312---regular-1760881456705
registryService.ts:221 ✅ Parsed 10 active events from range 1-10
registryService.ts:155 📦 get-events-range(1, 10) raw response: {
  "type": "(response (tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint)) UnknownType)",
  "value": {
    "type": "(tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint))",
    "value": {
      "end": {
        "type": "uint",
        "value": "10"
      },
      "events": {
        "type": "(list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))",
        "value": [
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-44---regular-1760864335704"
                },
                "contract-name": {
                  "type": "(string-ascii 38)",
                  "value": "summer-fest-44---regular-1760864335704"
                },
                "event-id": {
                  "type": "uint",
                  "value": "1"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "103324"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 40)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 40)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-2030---regular-1760865905401"
                },
                "contract-name": {
                  "type": "(string-ascii 40)",
                  "value": "summer-fest-2030---regular-1760865905401"
                },
                "event-id": {
                  "type": "uint",
                  "value": "2"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "103330"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-45---regular-1760873879263"
                },
                "contract-name": {
                  "type": "(string-ascii 38
registryService.ts:165 Tuple value: Object
registryService.ts:181 Found 10 items in events list
registryService.ts:194 Event 0 data: Object
registryService.ts:211 ✅ Added event 1: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-44---regular-1760864335704.summer-fest-44---regular-1760864335704
registryService.ts:194 Event 1 data: Object
registryService.ts:211 ✅ Added event 2: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-2030---regular-1760865905401.summer-fest-2030---regular-1760865905401
registryService.ts:194 Event 2 data: Object
registryService.ts:211 ✅ Added event 3: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-45---regular-1760873879263.summer-fest-45---regular-1760873879263
registryService.ts:194 Event 3 data: Object
registryService.ts:211 ✅ Added event 4: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-60---regular-1760877756240.summer-fest-60---regular-1760877756240
registryService.ts:194 Event 4 data: Object
registryService.ts:211 ✅ Added event 5: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest---regular-1760879040748.summer-fest---regular-1760879040748
registryService.ts:194 Event 5 data: Object
registryService.ts:211 ✅ Added event 6: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-335---regular-1760879424709.summer-fest-335---regular-1760879424709
registryService.ts:194 Event 6 data: Object
registryService.ts:211 ✅ Added event 7: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760879653136.summer-fest-2030---regular-1760879653136
registryService.ts:194 Event 7 data: Object
registryService.ts:211 ✅ Added event 8: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3345---regular-1760880140001.summer-fest-3345---regular-1760880140001
registryService.ts:194 Event 8 data: Object
registryService.ts:211 ✅ Added event 9: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760881234897.summer-fest-2030---regular-1760881234897
registryService.ts:194 Event 9 data: Object
registryService.ts:211 ✅ Added event 10: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3312---regular-1760881456705.summer-fest-3312---regular-1760881456705
registryService.ts:221 ✅ Parsed 10 active events from range 1-10
registryService.ts:269 Fetching events 11 to 20...
registryService.ts:269 Fetching events 11 to 20...
requestManager.ts:119 ⏳ [RequestManager] Deduplicating request: registry:get-events-range:0x01000000000000000000000000000000...
registryService.ts:155 📦 get-events-range(11, 20) raw response: {
  "type": "(response (tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint)) UnknownType)",
  "value": {
    "type": "(tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint))",
    "value": {
      "end": {
        "type": "uint",
        "value": "20"
      },
      "events": {
        "type": "(list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))",
        "value": [
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965379206"
                },
                "contract-name": {
                  "type": "(string-ascii 38)",
                  "value": "summer-fest-2030-regular-1760965379206"
                },
                "event-id": {
                  "type": "uint",
                  "value": "11"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "103740"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965769954"
                },
                "contract-name": {
                  "type": "(string-ascii 38)",
                  "value": "summer-fest-2030-regular-1760965769954"
                },
                "event-id": {
                  "type": "uint",
                  "value": "12"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "103742"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 40)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 40)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.rock-concert-live-show-vip-1760966631738"
                },
                "contract-name": {
                  "type": "(string-ascii 40
registryService.ts:165 Tuple value: Object
registryService.ts:181 Found 10 items in events list
registryService.ts:194 Event 0 data: Object
registryService.ts:211 ✅ Added event 11: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965379206.summer-fest-2030-regular-1760965379206
registryService.ts:194 Event 1 data: Object
registryService.ts:211 ✅ Added event 12: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965769954.summer-fest-2030-regular-1760965769954
registryService.ts:194 Event 2 data: Object
registryService.ts:211 ✅ Added event 13: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.rock-concert-live-show-vip-1760966631738.rock-concert-live-show-vip-1760966631738
registryService.ts:194 Event 3 data: Object
registryService.ts:211 ✅ Added event 14: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-virza-vip-1760966674673.dewa-19-feat-virza-vip-1760966674673
registryService.ts:194 Event 4 data: Object
registryService.ts:211 ✅ Added event 15: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello-regular-1760967749742.dewa-19-feat-ello-regular-1760967749742
registryService.ts:194 Event 5 data: Object
registryService.ts:211 ✅ Added event 16: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello---vip-1760967935998.dewa-19-feat-ello---vip-1760967935998
registryService.ts:194 Event 6 data: Object
registryService.ts:211 ✅ Added event 17: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1761024774525.summer-fest-2030-regular-1761024774525
registryService.ts:194 Event 7 data: Object
registryService.ts:211 ✅ Added event 18: ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.test-regular-1761027345947.test-regular-1761027345947
registryService.ts:194 Event 8 data: Object
registryService.ts:211 ✅ Added event 19: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1761048800012.summer-fest-2030-regular-1761048800012
registryService.ts:194 Event 9 data: Object
registryService.ts:211 ✅ Added event 20: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello-regular-1761061011735.dewa-19-feat-ello-regular-1761061011735
registryService.ts:221 ✅ Parsed 10 active events from range 11-20
registryService.ts:155 📦 get-events-range(11, 20) raw response: {
  "type": "(response (tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint)) UnknownType)",
  "value": {
    "type": "(tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint))",
    "value": {
      "end": {
        "type": "uint",
        "value": "20"
      },
      "events": {
        "type": "(list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))",
        "value": [
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965379206"
                },
                "contract-name": {
                  "type": "(string-ascii 38)",
                  "value": "summer-fest-2030-regular-1760965379206"
                },
                "event-id": {
                  "type": "uint",
                  "value": "11"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "103740"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965769954"
                },
                "contract-name": {
                  "type": "(string-ascii 38)",
                  "value": "summer-fest-2030-regular-1760965769954"
                },
                "event-id": {
                  "type": "uint",
                  "value": "12"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "103742"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 40)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 40)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.rock-concert-live-show-vip-1760966631738"
                },
                "contract-name": {
                  "type": "(string-ascii 40
registryService.ts:165 Tuple value: Object
registryService.ts:181 Found 10 items in events list
registryService.ts:194 Event 0 data: Object
registryService.ts:211 ✅ Added event 11: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965379206.summer-fest-2030-regular-1760965379206
registryService.ts:194 Event 1 data: Object
registryService.ts:211 ✅ Added event 12: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965769954.summer-fest-2030-regular-1760965769954
registryService.ts:194 Event 2 data: Object
registryService.ts:211 ✅ Added event 13: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.rock-concert-live-show-vip-1760966631738.rock-concert-live-show-vip-1760966631738
registryService.ts:194 Event 3 data: Object
registryService.ts:211 ✅ Added event 14: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-virza-vip-1760966674673.dewa-19-feat-virza-vip-1760966674673
registryService.ts:194 Event 4 data: Object
registryService.ts:211 ✅ Added event 15: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello-regular-1760967749742.dewa-19-feat-ello-regular-1760967749742
registryService.ts:194 Event 5 data: Object
registryService.ts:211 ✅ Added event 16: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello---vip-1760967935998.dewa-19-feat-ello---vip-1760967935998
registryService.ts:194 Event 6 data: Object
registryService.ts:211 ✅ Added event 17: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1761024774525.summer-fest-2030-regular-1761024774525
registryService.ts:194 Event 7 data: Object
registryService.ts:211 ✅ Added event 18: ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.test-regular-1761027345947.test-regular-1761027345947
registryService.ts:194 Event 8 data: Object
registryService.ts:211 ✅ Added event 19: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1761048800012.summer-fest-2030-regular-1761048800012
registryService.ts:194 Event 9 data: Object
registryService.ts:211 ✅ Added event 20: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello-regular-1761061011735.dewa-19-feat-ello-regular-1761061011735
registryService.ts:221 ✅ Parsed 10 active events from range 11-20
registryService.ts:269 Fetching events 21 to 23...
registryService.ts:269 Fetching events 21 to 23...
requestManager.ts:119 ⏳ [RequestManager] Deduplicating request: registry:get-events-range:0x01000000000000000000000000000000...
registryService.ts:155 📦 get-events-range(21, 23) raw response: {
  "type": "(response (tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint)) UnknownType)",
  "value": {
    "type": "(tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint))",
    "value": {
      "end": {
        "type": "uint",
        "value": "23"
      },
      "events": {
        "type": "(list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))",
        "value": [
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.qrtest-regular-1761065444216"
                },
                "contract-name": {
                  "type": "(string-ascii 28)",
                  "value": "qrtest-regular-1761065444216"
                },
                "event-id": {
                  "type": "uint",
                  "value": "21"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "104157"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 35)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 35)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.tradingcourse-regular-1761069879802"
                },
                "contract-name": {
                  "type": "(string-ascii 35)",
                  "value": "tradingcourse-regular-1761069879802"
                },
                "event-id": {
                  "type": "uint",
                  "value": "22"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "104174"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.really-regular-1761103903732"
                },
                "contract-name": {
                  "type": "(string-ascii 28)",
                  "value": "really-regular-1761103903732"
                },
                "event-id": {
                  "type": "uint",
                  "value": "23"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "104318"
                }
              }
            }
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          }
        ]
      },
      "start": {
        "type": "uint",
        "value": "21"
      }
    }
  },
  "success": true
}
registryService.ts:165 Tuple value: Object
registryService.ts:181 Found 10 items in events list
registryService.ts:194 Event 0 data: Object
registryService.ts:211 ✅ Added event 21: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.qrtest-regular-1761065444216.qrtest-regular-1761065444216
registryService.ts:194 Event 1 data: Object
registryService.ts:211 ✅ Added event 22: ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.tradingcourse-regular-1761069879802.tradingcourse-regular-1761069879802
registryService.ts:194 Event 2 data: Object
registryService.ts:211 ✅ Added event 23: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.really-regular-1761103903732.really-regular-1761103903732
registryService.ts:217 Item 3 is none (no event at this ID)
registryService.ts:217 Item 4 is none (no event at this ID)
registryService.ts:217 Item 5 is none (no event at this ID)
registryService.ts:217 Item 6 is none (no event at this ID)
registryService.ts:217 Item 7 is none (no event at this ID)
registryService.ts:217 Item 8 is none (no event at this ID)
registryService.ts:217 Item 9 is none (no event at this ID)
registryService.ts:221 ✅ Parsed 3 active events from range 21-23
registryService.ts:155 📦 get-events-range(21, 23) raw response: {
  "type": "(response (tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint)) UnknownType)",
  "value": {
    "type": "(tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint))",
    "value": {
      "end": {
        "type": "uint",
        "value": "23"
      },
      "events": {
        "type": "(list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))",
        "value": [
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.qrtest-regular-1761065444216"
                },
                "contract-name": {
                  "type": "(string-ascii 28)",
                  "value": "qrtest-regular-1761065444216"
                },
                "event-id": {
                  "type": "uint",
                  "value": "21"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "104157"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 35)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 35)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.tradingcourse-regular-1761069879802"
                },
                "contract-name": {
                  "type": "(string-ascii 35)",
                  "value": "tradingcourse-regular-1761069879802"
                },
                "event-id": {
                  "type": "uint",
                  "value": "22"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "104174"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.really-regular-1761103903732"
                },
                "contract-name": {
                  "type": "(string-ascii 28)",
                  "value": "really-regular-1761103903732"
                },
                "event-id": {
                  "type": "uint",
                  "value": "23"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "104318"
                }
              }
            }
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          }
        ]
      },
      "start": {
        "type": "uint",
        "value": "21"
      }
    }
  },
  "success": true
}
registryService.ts:165 Tuple value: Object
registryService.ts:181 Found 10 items in events list
registryService.ts:194 Event 0 data: Object
registryService.ts:211 ✅ Added event 21: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.qrtest-regular-1761065444216.qrtest-regular-1761065444216
registryService.ts:194 Event 1 data: Object
registryService.ts:211 ✅ Added event 22: ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.tradingcourse-regular-1761069879802.tradingcourse-regular-1761069879802
registryService.ts:194 Event 2 data: Object
registryService.ts:211 ✅ Added event 23: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.really-regular-1761103903732.really-regular-1761103903732
registryService.ts:217 Item 3 is none (no event at this ID)
registryService.ts:217 Item 4 is none (no event at this ID)
registryService.ts:217 Item 5 is none (no event at this ID)
registryService.ts:217 Item 6 is none (no event at this ID)
registryService.ts:217 Item 7 is none (no event at this ID)
registryService.ts:217 Item 8 is none (no event at this ID)
registryService.ts:217 Item 9 is none (no event at this ID)
registryService.ts:221 ✅ Parsed 3 active events from range 21-23
registryService.ts:275 ✅ Fetched 23 active events from registry
registryService.ts:275 ✅ Fetched 23 active events from registry
BrowseEvents.tsx:64 � Found 23 registered events in registry
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-44---regular-1760864335704
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-2030---regular-1760865905401
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-45---regular-1760873879263
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-60---regular-1760877756240
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest---regular-1760879040748
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-335---regular-1760879424709
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760879653136
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3345---regular-1760880140001
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760881234897
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3312---regular-1760881456705
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965379206
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965769954
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.rock-concert-live-show-vip-1760966631738
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-virza-vip-1760966674673
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello-regular-1760967749742
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello---vip-1760967935998
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1761024774525
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.test-regular-1761027345947
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1761048800012
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello-regular-1761061011735
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.qrtest-regular-1761065444216
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.tradingcourse-regular-1761069879802
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.really-regular-1761103903732
app:1 Access to fetch at 'http://localhost:8000/api/optimized/events' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/optimized/events:1  Failed to load resource: net::ERR_FAILED
registryService.ts:251 Server endpoint failed, falling back to original method: TypeError: Failed to fetch
    at getAllRegistryEvents (registryService.ts:237:30)
    at fetchDeploymentEvents (activityService.ts:323:34)
    at getGlobalActivity (activityService.ts:377:31)
    at async fetchActivities (ActivityFeed.tsx:131:29)
requestManager.ts:111 💾 [RequestManager] Cache hit: registry:get-total-events:...
registryService.ts:261 📊 Total events in registry: 23
registryService.ts:269 Fetching events 1 to 10...
requestManager.ts:111 💾 [RequestManager] Cache hit: registry:get-events-range:0x01000000000000000000000000000000...
registryService.ts:155 📦 get-events-range(1, 10) raw response: {
  "type": "(response (tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint)) UnknownType)",
  "value": {
    "type": "(tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint))",
    "value": {
      "end": {
        "type": "uint",
        "value": "10"
      },
      "events": {
        "type": "(list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))",
        "value": [
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-44---regular-1760864335704"
                },
                "contract-name": {
                  "type": "(string-ascii 38)",
                  "value": "summer-fest-44---regular-1760864335704"
                },
                "event-id": {
                  "type": "uint",
                  "value": "1"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "103324"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 40)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 40)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-2030---regular-1760865905401"
                },
                "contract-name": {
                  "type": "(string-ascii 40)",
                  "value": "summer-fest-2030---regular-1760865905401"
                },
                "event-id": {
                  "type": "uint",
                  "value": "2"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "103330"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-45---regular-1760873879263"
                },
                "contract-name": {
                  "type": "(string-ascii 38
registryService.ts:165 Tuple value: Object
registryService.ts:181 Found 10 items in events list
registryService.ts:194 Event 0 data: Object
registryService.ts:211 ✅ Added event 1: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-44---regular-1760864335704.summer-fest-44---regular-1760864335704
registryService.ts:194 Event 1 data: Object
registryService.ts:211 ✅ Added event 2: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-2030---regular-1760865905401.summer-fest-2030---regular-1760865905401
registryService.ts:194 Event 2 data: Object
registryService.ts:211 ✅ Added event 3: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-45---regular-1760873879263.summer-fest-45---regular-1760873879263
registryService.ts:194 Event 3 data: Object
registryService.ts:211 ✅ Added event 4: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-60---regular-1760877756240.summer-fest-60---regular-1760877756240
registryService.ts:194 Event 4 data: Object
registryService.ts:211 ✅ Added event 5: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest---regular-1760879040748.summer-fest---regular-1760879040748
registryService.ts:194 Event 5 data: Object
registryService.ts:211 ✅ Added event 6: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-335---regular-1760879424709.summer-fest-335---regular-1760879424709
registryService.ts:194 Event 6 data: Object
registryService.ts:211 ✅ Added event 7: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760879653136.summer-fest-2030---regular-1760879653136
registryService.ts:194 Event 7 data: Object
registryService.ts:211 ✅ Added event 8: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3345---regular-1760880140001.summer-fest-3345---regular-1760880140001
registryService.ts:194 Event 8 data: Object
registryService.ts:211 ✅ Added event 9: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760881234897.summer-fest-2030---regular-1760881234897
registryService.ts:194 Event 9 data: Object
registryService.ts:211 ✅ Added event 10: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3312---regular-1760881456705.summer-fest-3312---regular-1760881456705
registryService.ts:221 ✅ Parsed 10 active events from range 1-10
registryService.ts:269 Fetching events 11 to 20...
requestManager.ts:111 💾 [RequestManager] Cache hit: registry:get-events-range:0x01000000000000000000000000000000...
registryService.ts:155 📦 get-events-range(11, 20) raw response: {
  "type": "(response (tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint)) UnknownType)",
  "value": {
    "type": "(tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint))",
    "value": {
      "end": {
        "type": "uint",
        "value": "20"
      },
      "events": {
        "type": "(list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))",
        "value": [
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965379206"
                },
                "contract-name": {
                  "type": "(string-ascii 38)",
                  "value": "summer-fest-2030-regular-1760965379206"
                },
                "event-id": {
                  "type": "uint",
                  "value": "11"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "103740"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 38)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965769954"
                },
                "contract-name": {
                  "type": "(string-ascii 38)",
                  "value": "summer-fest-2030-regular-1760965769954"
                },
                "event-id": {
                  "type": "uint",
                  "value": "12"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "103742"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 40)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 40)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.rock-concert-live-show-vip-1760966631738"
                },
                "contract-name": {
                  "type": "(string-ascii 40
registryService.ts:165 Tuple value: Object
registryService.ts:181 Found 10 items in events list
registryService.ts:194 Event 0 data: Object
registryService.ts:211 ✅ Added event 11: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965379206.summer-fest-2030-regular-1760965379206
registryService.ts:194 Event 1 data: Object
registryService.ts:211 ✅ Added event 12: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965769954.summer-fest-2030-regular-1760965769954
registryService.ts:194 Event 2 data: Object
registryService.ts:211 ✅ Added event 13: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.rock-concert-live-show-vip-1760966631738.rock-concert-live-show-vip-1760966631738
registryService.ts:194 Event 3 data: Object
registryService.ts:211 ✅ Added event 14: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-virza-vip-1760966674673.dewa-19-feat-virza-vip-1760966674673
registryService.ts:194 Event 4 data: Object
registryService.ts:211 ✅ Added event 15: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello-regular-1760967749742.dewa-19-feat-ello-regular-1760967749742
registryService.ts:194 Event 5 data: Object
registryService.ts:211 ✅ Added event 16: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello---vip-1760967935998.dewa-19-feat-ello---vip-1760967935998
registryService.ts:194 Event 6 data: Object
registryService.ts:211 ✅ Added event 17: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1761024774525.summer-fest-2030-regular-1761024774525
registryService.ts:194 Event 7 data: Object
registryService.ts:211 ✅ Added event 18: ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.test-regular-1761027345947.test-regular-1761027345947
registryService.ts:194 Event 8 data: Object
registryService.ts:211 ✅ Added event 19: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1761048800012.summer-fest-2030-regular-1761048800012
registryService.ts:194 Event 9 data: Object
registryService.ts:211 ✅ Added event 20: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello-regular-1761061011735.dewa-19-feat-ello-regular-1761061011735
registryService.ts:221 ✅ Parsed 10 active events from range 11-20
registryService.ts:269 Fetching events 21 to 23...
requestManager.ts:111 💾 [RequestManager] Cache hit: registry:get-events-range:0x01000000000000000000000000000000...
registryService.ts:155 📦 get-events-range(21, 23) raw response: {
  "type": "(response (tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint)) UnknownType)",
  "value": {
    "type": "(tuple (end uint) (events (list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))) (start uint))",
    "value": {
      "end": {
        "type": "uint",
        "value": "23"
      },
      "events": {
        "type": "(list 10 (optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))))",
        "value": [
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.qrtest-regular-1761065444216"
                },
                "contract-name": {
                  "type": "(string-ascii 28)",
                  "value": "qrtest-regular-1761065444216"
                },
                "event-id": {
                  "type": "uint",
                  "value": "21"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "104157"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 35)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 35)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.tradingcourse-regular-1761069879802"
                },
                "contract-name": {
                  "type": "(string-ascii 35)",
                  "value": "tradingcourse-regular-1761069879802"
                },
                "event-id": {
                  "type": "uint",
                  "value": "22"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "104174"
                }
              }
            }
          },
          {
            "type": "(optional (tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint)))",
            "value": {
              "type": "(tuple (contract-address principal) (contract-name (string-ascii 28)) (event-id uint) (is-active bool) (is-featured bool) (is-verified bool) (organizer principal) (registered-at uint))",
              "value": {
                "contract-address": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.really-regular-1761103903732"
                },
                "contract-name": {
                  "type": "(string-ascii 28)",
                  "value": "really-regular-1761103903732"
                },
                "event-id": {
                  "type": "uint",
                  "value": "23"
                },
                "is-active": {
                  "type": "bool",
                  "value": true
                },
                "is-featured": {
                  "type": "bool",
                  "value": false
                },
                "is-verified": {
                  "type": "bool",
                  "value": false
                },
                "organizer": {
                  "type": "principal",
                  "value": "ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX"
                },
                "registered-at": {
                  "type": "uint",
                  "value": "104318"
                }
              }
            }
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          },
          {
            "type": "(optional none)",
            "value": null
          }
        ]
      },
      "start": {
        "type": "uint",
        "value": "21"
      }
    }
  },
  "success": true
}
registryService.ts:165 Tuple value: Object
registryService.ts:181 Found 10 items in events list
registryService.ts:194 Event 0 data: Object
registryService.ts:211 ✅ Added event 21: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.qrtest-regular-1761065444216.qrtest-regular-1761065444216
registryService.ts:194 Event 1 data: Object
registryService.ts:211 ✅ Added event 22: ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.tradingcourse-regular-1761069879802.tradingcourse-regular-1761069879802
registryService.ts:194 Event 2 data: Object
registryService.ts:211 ✅ Added event 23: ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.really-regular-1761103903732.really-regular-1761103903732
registryService.ts:217 Item 3 is none (no event at this ID)
registryService.ts:217 Item 4 is none (no event at this ID)
registryService.ts:217 Item 5 is none (no event at this ID)
registryService.ts:217 Item 6 is none (no event at this ID)
registryService.ts:217 Item 7 is none (no event at this ID)
registryService.ts:217 Item 8 is none (no event at this ID)
registryService.ts:217 Item 9 is none (no event at this ID)
registryService.ts:221 ✅ Parsed 3 active events from range 21-23
registryService.ts:275 ✅ Fetched 23 active events from registry
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-44---regular-1760864335704
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-2030---regular-1760865905401
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-45---regular-1760873879263
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-60---regular-1760877756240
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest---regular-1760879040748
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-335---regular-1760879424709
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760879653136
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3345---regular-1760880140001
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760881234897
nftIndexer.ts:876 🔍 [getEventDataFromContract] Fetching data for: ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3312---regular-1760881456705
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-44---regular-1760864335704' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-44---regular-1760864335704:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-2030---regular-1760865905401' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-2030---regular-1760865905401:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-45---regular-1760873879263' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-45---regular-1760873879263:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest---regular-1760879040748' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest---regular-1760879040748:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-60---regular-1760877756240' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-60---regular-1760877756240:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-335---regular-1760879424709' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-335---regular-1760879424709:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760879653136' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760879653136:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3345---regular-1760880140001' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3345---regular-1760880140001:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760881234897' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760881234897:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3312---regular-1760881456705' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3312---regular-1760881456705:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965379206' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965379206:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965769954' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1760965769954:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.rock-concert-live-show-vip-1760966631738' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.rock-concert-live-show-vip-1760966631738:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-virza-vip-1760966674673' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-virza-vip-1760966674673:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello-regular-1760967749742' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello-regular-1760967749742:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello---vip-1760967935998' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello---vip-1760967935998:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1761024774525' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1761024774525:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.test-regular-1761027345947' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.test-regular-1761027345947:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1761048800012' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.summer-fest-2030-regular-1761048800012:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello-regular-1761061011735' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.dewa-19-feat-ello-regular-1761061011735:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.qrtest-regular-1761065444216' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.qrtest-regular-1761065444216:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.tradingcourse-regular-1761069879802' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ.tradingcourse-regular-1761069879802:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.really-regular-1761103903732' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX.really-regular-1761103903732:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at BrowseEvents.tsx:76:37
    at Array.map (<anonymous>)
    at loadEvents (BrowseEvents.tsx:67:70)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-44---regular-1760864335704' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-44---regular-1760864335704:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at requestManager.request.cacheTTL (activityService.ts:596:15)
    at RequestManager.executeWithRetry (requestManager.ts:159:22)
    at RequestManager.request (requestManager.ts:125:33)
    at activityService.ts:594:46
    at Array.map (<anonymous>)
    at convertDeploymentsToActivitiesOptimized (activityService.ts:588:41)
    at getGlobalActivity (activityService.ts:382:38)
    at async fetchActivities (ActivityFeed.tsx:131:29)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-2030---regular-1760865905401' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-2030---regular-1760865905401:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at requestManager.request.cacheTTL (activityService.ts:596:15)
    at RequestManager.executeWithRetry (requestManager.ts:159:22)
    at RequestManager.request (requestManager.ts:125:33)
    at activityService.ts:594:46
    at Array.map (<anonymous>)
    at convertDeploymentsToActivitiesOptimized (activityService.ts:588:41)
    at getGlobalActivity (activityService.ts:382:38)
    at async fetchActivities (ActivityFeed.tsx:131:29)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-45---regular-1760873879263' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-45---regular-1760873879263:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at requestManager.request.cacheTTL (activityService.ts:596:15)
    at RequestManager.executeWithRetry (requestManager.ts:159:22)
    at RequestManager.request (requestManager.ts:125:33)
    at activityService.ts:594:46
    at Array.map (<anonymous>)
    at convertDeploymentsToActivitiesOptimized (activityService.ts:588:41)
    at getGlobalActivity (activityService.ts:382:38)
    at async fetchActivities (ActivityFeed.tsx:131:29)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-60---regular-1760877756240' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-60---regular-1760877756240:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at requestManager.request.cacheTTL (activityService.ts:596:15)
    at RequestManager.executeWithRetry (requestManager.ts:159:22)
    at RequestManager.request (requestManager.ts:125:33)
    at activityService.ts:594:46
    at Array.map (<anonymous>)
    at convertDeploymentsToActivitiesOptimized (activityService.ts:588:41)
    at getGlobalActivity (activityService.ts:382:38)
    at async fetchActivities (ActivityFeed.tsx:131:29)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760879653136' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760879653136:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at requestManager.request.cacheTTL (activityService.ts:596:15)
    at RequestManager.executeWithRetry (requestManager.ts:159:22)
    at RequestManager.request (requestManager.ts:125:33)
    at activityService.ts:594:46
    at Array.map (<anonymous>)
    at convertDeploymentsToActivitiesOptimized (activityService.ts:588:41)
    at getGlobalActivity (activityService.ts:382:38)
    at async fetchActivities (ActivityFeed.tsx:131:29)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest---regular-1760879040748' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest---regular-1760879040748:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at requestManager.request.cacheTTL (activityService.ts:596:15)
    at RequestManager.executeWithRetry (requestManager.ts:159:22)
    at RequestManager.request (requestManager.ts:125:33)
    at activityService.ts:594:46
    at Array.map (<anonymous>)
    at convertDeploymentsToActivitiesOptimized (activityService.ts:588:41)
    at getGlobalActivity (activityService.ts:382:38)
    at async fetchActivities (ActivityFeed.tsx:131:29)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-335---regular-1760879424709' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-335---regular-1760879424709:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at requestManager.request.cacheTTL (activityService.ts:596:15)
    at RequestManager.executeWithRetry (requestManager.ts:159:22)
    at RequestManager.request (requestManager.ts:125:33)
    at activityService.ts:594:46
    at Array.map (<anonymous>)
    at convertDeploymentsToActivitiesOptimized (activityService.ts:588:41)
    at getGlobalActivity (activityService.ts:382:38)
    at async fetchActivities (ActivityFeed.tsx:131:29)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3345---regular-1760880140001' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3345---regular-1760880140001:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at requestManager.request.cacheTTL (activityService.ts:596:15)
    at RequestManager.executeWithRetry (requestManager.ts:159:22)
    at RequestManager.request (requestManager.ts:125:33)
    at activityService.ts:594:46
    at Array.map (<anonymous>)
    at convertDeploymentsToActivitiesOptimized (activityService.ts:588:41)
    at getGlobalActivity (activityService.ts:382:38)
    at async fetchActivities (ActivityFeed.tsx:131:29)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760881234897' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760881234897:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at requestManager.request.cacheTTL (activityService.ts:596:15)
    at RequestManager.executeWithRetry (requestManager.ts:159:22)
    at RequestManager.request (requestManager.ts:125:33)
    at activityService.ts:594:46
    at Array.map (<anonymous>)
    at convertDeploymentsToActivitiesOptimized (activityService.ts:588:41)
    at getGlobalActivity (activityService.ts:382:38)
    at async fetchActivities (ActivityFeed.tsx:131:29)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-44---regular-1760864335704/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-44---regular-1760864335704/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 0)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3312---regular-1760881456705' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/nft-ticket/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-3312---regular-1760881456705:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:374 Server NFT data fetch failed, falling back to direct Stacks.js calls: TypeError: Failed to fetch
    at getNFTTicketDataWithStacks (stacksReader.ts:362:28)
    at getEventDataFromContract (nftIndexer.ts:881:30)
    at requestManager.request.cacheTTL (activityService.ts:596:15)
    at RequestManager.executeWithRetry (requestManager.ts:159:22)
    at RequestManager.request (requestManager.ts:125:33)
    at activityService.ts:594:46
    at Array.map (<anonymous>)
    at convertDeploymentsToActivitiesOptimized (activityService.ts:588:41)
    at getGlobalActivity (activityService.ts:382:38)
    at async fetchActivities (ActivityFeed.tsx:131:29)
getNFTTicketDataWithStacks @ stacksReader.ts:374
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-2030---regular-1760865905401/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-2030---regular-1760865905401/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 1)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-45---regular-1760873879263/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-45---regular-1760873879263/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 2)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest---regular-1760879040748/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest---regular-1760879040748/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 4)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-60---regular-1760877756240/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-60---regular-1760877756240/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 3)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-335---regular-1760879424709/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-335---regular-1760879424709/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 5)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-2030---regular-1760879653136/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-2030---regular-1760879653136/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 6)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-3345---regular-1760880140001/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-3345---regular-1760880140001/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 7)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-2030---regular-1760881234897/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-2030---regular-1760881234897/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 8)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-3312---regular-1760881456705/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-3312---regular-1760881456705/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 9)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/summer-fest-2030-regular-1760965379206/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/summer-fest-2030-regular-1760965379206/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 10)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/summer-fest-2030-regular-1760965769954/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/summer-fest-2030-regular-1760965769954/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 11)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/rock-concert-live-show-vip-1760966631738/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/rock-concert-live-show-vip-1760966631738/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 12)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/dewa-19-feat-virza-vip-1760966674673/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/dewa-19-feat-virza-vip-1760966674673/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 13)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/dewa-19-feat-ello-regular-1760967749742/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/dewa-19-feat-ello-regular-1760967749742/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 14)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/dewa-19-feat-ello---vip-1760967935998/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/dewa-19-feat-ello---vip-1760967935998/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 15)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/summer-fest-2030-regular-1761024774525/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/summer-fest-2030-regular-1761024774525/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 16)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ/test-regular-1761027345947/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ/test-regular-1761027345947/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 17)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/summer-fest-2030-regular-1761048800012/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/summer-fest-2030-regular-1761048800012/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 18)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/dewa-19-feat-ello-regular-1761061011735/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/dewa-19-feat-ello-regular-1761061011735/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 19)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/qrtest-regular-1761065444216/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/qrtest-regular-1761065444216/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 20)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ/tradingcourse-regular-1761069879802/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST1VFXCHA0D3Y1CMJ4GH07V6J7P6X913RVJYBYJFZ/tradingcourse-regular-1761069879802/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 21)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/really-regular-1761103903732/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX/really-regular-1761103903732/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async BrowseEvents.tsx:76:31
    at async Promise.all (index 22)
    at async loadEvents (BrowseEvents.tsx:184:27)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-44---regular-1760864335704/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-44---regular-1760864335704/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async RequestManager.executeWithRetry (requestManager.ts:159:16)
    at async RequestManager.request (requestManager.ts:131:20)
    at async activityService.ts:594:25
    at async Promise.all (index 0)
    at async convertDeploymentsToActivitiesOptimized (activityService.ts:611:19)
    at async getGlobalActivity (activityService.ts:382:32)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-2030---regular-1760865905401/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-2030---regular-1760865905401/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async RequestManager.executeWithRetry (requestManager.ts:159:16)
    at async RequestManager.request (requestManager.ts:131:20)
    at async activityService.ts:594:25
    at async Promise.all (index 1)
    at async convertDeploymentsToActivitiesOptimized (activityService.ts:611:19)
    at async getGlobalActivity (activityService.ts:382:32)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-45---regular-1760873879263/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-45---regular-1760873879263/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async RequestManager.executeWithRetry (requestManager.ts:159:16)
    at async RequestManager.request (requestManager.ts:131:20)
    at async activityService.ts:594:25
    at async Promise.all (index 2)
    at async convertDeploymentsToActivitiesOptimized (activityService.ts:611:19)
    at async getGlobalActivity (activityService.ts:382:32)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-60---regular-1760877756240/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-60---regular-1760877756240/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async RequestManager.executeWithRetry (requestManager.ts:159:16)
    at async RequestManager.request (requestManager.ts:131:20)
    at async activityService.ts:594:25
    at async Promise.all (index 3)
    at async convertDeploymentsToActivitiesOptimized (activityService.ts:611:19)
    at async getGlobalActivity (activityService.ts:382:32)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-2030---regular-1760879653136/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-2030---regular-1760879653136/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async RequestManager.executeWithRetry (requestManager.ts:159:16)
    at async RequestManager.request (requestManager.ts:131:20)
    at async activityService.ts:594:25
    at async Promise.all (index 6)
    at async convertDeploymentsToActivitiesOptimized (activityService.ts:611:19)
    at async getGlobalActivity (activityService.ts:382:32)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest---regular-1760879040748/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest---regular-1760879040748/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async RequestManager.executeWithRetry (requestManager.ts:159:16)
    at async RequestManager.request (requestManager.ts:131:20)
    at async activityService.ts:594:25
    at async Promise.all (index 4)
    at async convertDeploymentsToActivitiesOptimized (activityService.ts:611:19)
    at async getGlobalActivity (activityService.ts:382:32)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-335---regular-1760879424709/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-335---regular-1760879424709/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async RequestManager.executeWithRetry (requestManager.ts:159:16)
    at async RequestManager.request (requestManager.ts:131:20)
    at async activityService.ts:594:25
    at async Promise.all (index 5)
    at async convertDeploymentsToActivitiesOptimized (activityService.ts:611:19)
    at async getGlobalActivity (activityService.ts:382:32)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-3345---regular-1760880140001/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-3345---regular-1760880140001/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async RequestManager.executeWithRetry (requestManager.ts:159:16)
    at async RequestManager.request (requestManager.ts:131:20)
    at async activityService.ts:594:25
    at async Promise.all (index 7)
    at async convertDeploymentsToActivitiesOptimized (activityService.ts:611:19)
    at async getGlobalActivity (activityService.ts:382:32)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-2030---regular-1760881234897/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-2030---regular-1760881234897/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async RequestManager.executeWithRetry (requestManager.ts:159:16)
    at async RequestManager.request (requestManager.ts:131:20)
    at async activityService.ts:594:25
    at async Promise.all (index 8)
    at async convertDeploymentsToActivitiesOptimized (activityService.ts:611:19)
    at async getGlobalActivity (activityService.ts:382:32)
callReadOnlyContractFunction @ stacksReader.ts:49
app:1 Access to fetch at 'http://localhost:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-3312---regular-1760881456705/call-read/get-event-details' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin. Have the server send the header with a valid value.
:8000/api/stacks/contract/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-3312---regular-1760881456705/call-read/get-event-details:1  Failed to load resource: net::ERR_FAILED
stacksReader.ts:49 Server call failed, falling back to direct Stacks.js call: TypeError: Failed to fetch
    at callReadOnlyContractFunction (stacksReader.ts:31:28)
    at getEventDetails (stacksReader.ts:339:24)
    at getNFTTicketDataWithStacks (stacksReader.ts:380:32)
    at async getEventDataFromContract (nftIndexer.ts:881:24)
    at async RequestManager.executeWithRetry (requestManager.ts:159:16)
    at async RequestManager.request (requestManager.ts:131:20)
    at async activityService.ts:594:25
    at async Promise.all (index 9)
    at async convertDeploymentsToActivitiesOptimized (activityService.ts:611:19)
    at async getGlobalActivity (activityService.ts:382:32)
callReadOnlyContractFunction @ stacksReader.ts:49
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
stacksReader.ts:383 ✅ [Stacks.js] Got event details: Object
nftIndexer.ts:935 ✅ [getEventDataFromContract] Got Stacks data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
BrowseEvents.tsx:185 ✅ Total events loaded: 23
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
nftIndexer.ts:1014 📊 [getEventDataFromContract] Final event data: Object
requestManager.ts:111 💾 [RequestManager] Cache hit: event-data:ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-...
activityService.ts:417   ❌ Error fetching activity: TypeError: address.slice is not a function
    at formatAddress (activityService.ts:668:21)
    at activityService.ts:486:20
    at Array.map (<anonymous>)
    at convertMintsToActivitiesOptimized (activityService.ts:480:16)
    at async activityService.ts:412:22
    at async Promise.all (index 0)
    at async getGlobalActivity (activityService.ts:422:30)
    at async fetchActivities (ActivityFeed.tsx:131:29)
(anonymous) @ activityService.ts:417
requestManager.ts:111 💾 [RequestManager] Cache hit: event-data:ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-...
activityService.ts:417   ❌ Error fetching activity: TypeError: address.slice is not a function
    at formatAddress (activityService.ts:668:21)
    at activityService.ts:486:20
    at Array.map (<anonymous>)
    at convertMintsToActivitiesOptimized (activityService.ts:480:16)
    at async activityService.ts:412:22
    at async Promise.all (index 1)
    at async getGlobalActivity (activityService.ts:422:30)
    at async fetchActivities (ActivityFeed.tsx:131:29)
(anonymous) @ activityService.ts:417
activityService.ts:252 Fetch finished loading: POST "https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-2030---regular-1760865905401/get-owner".
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:252
activityService.ts:145 Fetch finished loading: GET "https://api.testnet.hiro.so/extended/v1/tokens/nft/mints?asset_identifier=ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-45---regular-1760873879263%3A%3Aevent-ticket&limit=3".
requestManager.request.cacheTTL @ activityService.ts:145
executeWithRetry @ requestManager.ts:159
request @ requestManager.ts:125
fetchFromHiroAPI @ activityService.ts:142
fetchNFTEventsFromAPI @ activityService.ts:179
fetchMintEvents @ activityService.ts:208
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:145 Fetch finished loading: GET "https://api.testnet.hiro.so/extended/v1/tokens/nft/mints?asset_identifier=ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-fest-60---regular-1760877756240%3A%3Aevent-ticket&limit=3".
requestManager.request.cacheTTL @ activityService.ts:145
executeWithRetry @ requestManager.ts:159
request @ requestManager.ts:125
fetchFromHiroAPI @ activityService.ts:142
fetchNFTEventsFromAPI @ activityService.ts:179
fetchMintEvents @ activityService.ts:208
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:227 Fetch finished loading: POST "https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-45---regular-1760873879263/get-last-token-id".
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:227
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:227 Fetch finished loading: POST "https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-60---regular-1760877756240/get-last-token-id".
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:227
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
app:1 Access to fetch at 'https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-45---regular-1760873879263/get-owner' from origin 'http://localhost:8080' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
activityService.ts:252  POST https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-45---regular-1760873879263/get-owner net::ERR_FAILED 429 (Too Many Requests)
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:252
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:252 Fetch failed loading: POST "https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-45---regular-1760873879263/get-owner".
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:252
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
app:1 Access to fetch at 'https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-60---regular-1760877756240/get-owner' from origin 'http://localhost:8080' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
activityService.ts:252  POST https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-60---regular-1760877756240/get-owner net::ERR_FAILED 429 (Too Many Requests)
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:252
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:252 Fetch failed loading: POST "https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-60---regular-1760877756240/get-owner".
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:252
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
app:1 Access to fetch at 'https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-45---regular-1760873879263/get-owner' from origin 'http://localhost:8080' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
activityService.ts:252  POST https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-45---regular-1760873879263/get-owner net::ERR_FAILED 429 (Too Many Requests)
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:252
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
requestManager.ts:111 💾 [RequestManager] Cache hit: event-data:ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-...
activityService.ts:252 Fetch failed loading: POST "https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-45---regular-1760873879263/get-owner".
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:252
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
app:1 Access to fetch at 'https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-60---regular-1760877756240/get-owner' from origin 'http://localhost:8080' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
activityService.ts:252  POST https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-60---regular-1760877756240/get-owner net::ERR_FAILED 429 (Too Many Requests)
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:252
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:252 Fetch failed loading: POST "https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-60---regular-1760877756240/get-owner".
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:252
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
app:1 Access to fetch at 'https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-60---regular-1760877756240/get-owner' from origin 'http://localhost:8080' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
activityService.ts:252  POST https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-60---regular-1760877756240/get-owner net::ERR_FAILED 429 (Too Many Requests)
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:252
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:252 Fetch failed loading: POST "https://api.testnet.hiro.so/v2/contracts/call-read/ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C/summer-fest-60---regular-1760877756240/get-owner".
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:252
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
requestManager.ts:111 💾 [RequestManager] Cache hit: event-data:ST1X7MNQF6TKA52PA7JRH99S9KKXH9TY8CSG8AK4C.summer-...
activityService.ts:145 Fetch finished loading: GET "https://api.testnet.hiro.so/extended/v1/tokens/nft/mints?asset_identifier=ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest---regular-1760879040748%3A%3Aevent-ticket&limit=3".
requestManager.request.cacheTTL @ activityService.ts:145
executeWithRetry @ requestManager.ts:159
request @ requestManager.ts:125
fetchFromHiroAPI @ activityService.ts:142
fetchNFTEventsFromAPI @ activityService.ts:179
fetchMintEvents @ activityService.ts:208
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:145 Fetch finished loading: GET "https://api.testnet.hiro.so/extended/v1/tokens/nft/mints?asset_identifier=ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-335---regular-1760879424709%3A%3Aevent-ticket&limit=3".
requestManager.request.cacheTTL @ activityService.ts:145
executeWithRetry @ requestManager.ts:159
request @ requestManager.ts:125
fetchFromHiroAPI @ activityService.ts:142
fetchNFTEventsFromAPI @ activityService.ts:179
fetchMintEvents @ activityService.ts:208
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
app:1 Access to fetch at 'https://api.testnet.hiro.so/v2/contracts/call-read/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-335---regular-1760879424709/get-last-token-id' from origin 'http://localhost:8080' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
activityService.ts:227  POST https://api.testnet.hiro.so/v2/contracts/call-read/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-335---regular-1760879424709/get-last-token-id net::ERR_FAILED 429 (Too Many Requests)
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:227
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:282     ⚠️ Contract not accessible: TypeError: Failed to fetch
    at fetchWrapper (chunk-2OHD443C.js?v=741298f3:560:29)
    at StacksTestnet.fetchFn (chunk-2OHD443C.js?v=741298f3:603:26)
    at callReadOnlyFunction (@stacks_transactions.js?v=741298f3:3280:34)
    at fetchMintEvents (activityService.ts:227:41)
    at async activityService.ts:409:32
    at async Promise.all (index 1)
    at async getGlobalActivity (activityService.ts:422:30)
    at async fetchActivities (ActivityFeed.tsx:131:29)
fetchMintEvents @ activityService.ts:282
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
app:1 Access to fetch at 'https://api.testnet.hiro.so/v2/contracts/call-read/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest---regular-1760879040748/get-last-token-id' from origin 'http://localhost:8080' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
activityService.ts:227  POST https://api.testnet.hiro.so/v2/contracts/call-read/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest---regular-1760879040748/get-last-token-id net::ERR_FAILED 429 (Too Many Requests)
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:227
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:282     ⚠️ Contract not accessible: TypeError: Failed to fetch
    at fetchWrapper (chunk-2OHD443C.js?v=741298f3:560:29)
    at StacksTestnet.fetchFn (chunk-2OHD443C.js?v=741298f3:603:26)
    at callReadOnlyFunction (@stacks_transactions.js?v=741298f3:3280:34)
    at fetchMintEvents (activityService.ts:227:41)
    at async activityService.ts:409:32
    at async Promise.all (index 0)
    at async getGlobalActivity (activityService.ts:422:30)
    at async fetchActivities (ActivityFeed.tsx:131:29)
fetchMintEvents @ activityService.ts:282
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:227 Fetch failed loading: POST "https://api.testnet.hiro.so/v2/contracts/call-read/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-335---regular-1760879424709/get-last-token-id".
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:227
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:227 Fetch failed loading: POST "https://api.testnet.hiro.so/v2/contracts/call-read/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest---regular-1760879040748/get-last-token-id".
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:227
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:145 Fetch finished loading: GET "https://api.testnet.hiro.so/extended/v1/tokens/nft/mints?asset_identifier=ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW.summer-fest-2030---regular-1760879653136%3A%3Aevent-ticket&limit=3".
requestManager.request.cacheTTL @ activityService.ts:145
executeWithRetry @ requestManager.ts:159
request @ requestManager.ts:125
fetchFromHiroAPI @ activityService.ts:142
fetchNFTEventsFromAPI @ activityService.ts:179
fetchMintEvents @ activityService.ts:208
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
app:1 Access to fetch at 'https://api.testnet.hiro.so/v2/contracts/call-read/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-2030---regular-1760879653136/get-last-token-id' from origin 'http://localhost:8080' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
activityService.ts:227  POST https://api.testnet.hiro.so/v2/contracts/call-read/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-2030---regular-1760879653136/get-last-token-id net::ERR_FAILED 429 (Too Many Requests)
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:227
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:282     ⚠️ Contract not accessible: TypeError: Failed to fetch
    at fetchWrapper (chunk-2OHD443C.js?v=741298f3:560:29)
    at StacksTestnet.fetchFn (chunk-2OHD443C.js?v=741298f3:603:26)
    at callReadOnlyFunction (@stacks_transactions.js?v=741298f3:3280:34)
    at fetchMintEvents (activityService.ts:227:41)
    at async activityService.ts:409:32
    at async Promise.all (index 0)
    at async getGlobalActivity (activityService.ts:422:30)
    at async fetchActivities (ActivityFeed.tsx:131:29)
fetchMintEvents @ activityService.ts:282
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
activityService.ts:227 Fetch failed loading: POST "https://api.testnet.hiro.so/v2/contracts/call-read/ST3DPJX81A9MDMPJ0DG6JYE7DX7P2NKHPXA5FMVZW/summer-fest-2030---regular-1760879653136/get-last-token-id".
fetchWrapper @ chunk-2OHD443C.js?v=741298f3:560
fetchFn @ chunk-2OHD443C.js?v=741298f3:603
callReadOnlyFunction @ @stacks_transactions.js?v=741298f3:3280
fetchMintEvents @ activityService.ts:227
await in fetchMintEvents
(anonymous) @ activityService.ts:409
getGlobalActivity @ activityService.ts:397
WalletContext.tsx:417 Fetch finished loading: GET "https://api.testnet.hiro.so/v2/accounts/ST26BA8QY8JC11KWDMSQS4ASMY6V2PSYQ26KYBWEX".
getBalance @ WalletContext.tsx:417
fetchBalance @ AppLayout.tsx:84