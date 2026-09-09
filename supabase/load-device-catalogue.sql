-- ============================================================================
--  Load the shared device catalogue into site_settings
--
--  Both apps read the device list from site_settings.content ->
--  'deviceManufacturers': the website's booking wizard walks it as
--  type -> brand -> model -> generation, and NovaOps's DevicePicker searches
--  the same list flattened. This file writes it.
--
--  The same catalogue also ships as the default in the website repo
--  (src/lib/siteStore.ts), so a fresh install already has it. This is for a
--  project whose site_settings row already exists — the stored row wins over
--  the defaults, so without this the live site keeps the old short list.
--
--  It REPLACES deviceManufacturers and leaves every other key in
--  site_settings.content alone. Replacing rather than merging is deliberate:
--  this list supersedes both the old hand-written defaults and anything
--  imported from the legacy `devices` table, and merging would leave
--  duplicate spellings of the same phone behind. Anything you have added by
--  hand in Admin -> Site Content under Devices will be overwritten; every
--  other section of site content is untouched.
--
--  Safe to re-run.
-- ============================================================================

do $$
declare
  cat      jsonb := $json$
[
  {
    "id": "apple",
    "name": "Apple",
    "categories": [
      {
        "id": "apple-phone",
        "name": "Phone",
        "models": [
          {
            "id": "apple-iphone",
            "name": "iPhone",
            "generations": [
              "17 Pro Max",
              "17 Pro",
              "17",
              "Air",
              "16e",
              "16 Pro Max",
              "16 Pro",
              "16 Plus",
              "16",
              "15 Pro Max",
              "15 Pro",
              "15 Plus",
              "15",
              "SE (3rd gen)",
              "14 Pro Max",
              "14 Pro",
              "14 Plus",
              "14",
              "13 Pro Max",
              "13 Pro",
              "13",
              "13 mini",
              "12 Pro Max",
              "12 Pro",
              "12",
              "12 mini",
              "SE (2nd gen)",
              "11 Pro Max",
              "11 Pro",
              "11"
            ]
          }
        ]
      },
      {
        "id": "apple-tablet",
        "name": "Tablet",
        "models": [
          {
            "id": "apple-ipad-pro",
            "name": "iPad Pro",
            "generations": [
              "(8th gen, M5)",
              "(7th gen, M4)",
              "(6th gen, M2)",
              "(5th gen, M1)",
              "(4th gen, A12Z)"
            ]
          },
          {
            "id": "apple-ipad-air",
            "name": "iPad Air",
            "generations": [
              "(8th gen, M4)",
              "(7th gen, M3)",
              "(6th gen, M2)",
              "(5th gen, M1)",
              "(4th gen)",
              "(3rd gen)"
            ]
          },
          {
            "id": "apple-ipad",
            "name": "iPad",
            "generations": [
              "(11th gen, A16)",
              "(10th gen)",
              "(9th gen)",
              "(8th gen)",
              "(7th gen)"
            ]
          },
          {
            "id": "apple-ipad-mini",
            "name": "iPad mini",
            "generations": [
              "(7th gen, A17 Pro)",
              "(6th gen)",
              "(5th gen)"
            ]
          }
        ]
      },
      {
        "id": "apple-laptop",
        "name": "Laptop",
        "models": [
          {
            "id": "apple-macbook-pro",
            "name": "MacBook Pro",
            "generations": [
              "16\" (M5 Pro/Max)",
              "14\" (M5)",
              "16\" (M4 Pro/Max)",
              "14\" (M4)",
              "16\" (M3 Pro/Max)",
              "14\" (M3)",
              "16\" (M2 Pro/Max)",
              "14\" (M2 Pro/Max)",
              "13\" (M2)",
              "16\" (M1 Pro/Max)",
              "14\" (M1 Pro/Max)",
              "13\" (M1)",
              "16\" (Intel)",
              "13\" (Intel)"
            ]
          },
          {
            "id": "apple-macbook-air",
            "name": "MacBook Air",
            "generations": [
              "15\" (M5)",
              "13\" (M5)",
              "15\" (M4)",
              "13\" (M4)",
              "15\" (M3)",
              "13\" (M3)",
              "15\" (M2)",
              "13\" (M2)",
              "13\" (M1)",
              "13\" (Intel)"
            ]
          },
          {
            "id": "apple-macbook-neo",
            "name": "MacBook Neo",
            "generations": []
          }
        ]
      },
      {
        "id": "apple-desktop",
        "name": "Desktop",
        "models": [
          {
            "id": "apple-mac-studio",
            "name": "Mac Studio",
            "generations": [
              "(M5 Max/Ultra)",
              "(M3 Ultra)",
              "(M2 Max/Ultra)",
              "(M1 Max/Ultra)"
            ]
          },
          {
            "id": "apple-mac-mini",
            "name": "Mac mini",
            "generations": [
              "(M6/M5 Pro)",
              "(M4/M4 Pro)",
              "(M1)",
              "(Intel)"
            ]
          },
          {
            "id": "apple-imac",
            "name": "iMac",
            "generations": [
              "24\" (M4)",
              "24\" (M3)",
              "24\" (M1)",
              "(Intel)"
            ]
          },
          {
            "id": "apple-mac-pro",
            "name": "Mac Pro",
            "generations": [
              "(M2 Ultra)",
              "(2019, Intel Xeon)"
            ]
          }
        ]
      },
      {
        "id": "apple-watch",
        "name": "Watch",
        "models": [
          {
            "id": "apple-series",
            "name": "Series",
            "generations": [
              "11",
              "10",
              "9",
              "8",
              "7",
              "6",
              "5"
            ]
          },
          {
            "id": "apple-se",
            "name": "SE",
            "generations": [
              "(3rd gen)",
              "(2nd gen)",
              "(1st gen)"
            ]
          },
          {
            "id": "apple-ultra",
            "name": "Ultra",
            "generations": [
              "3",
              "2",
              "(1st gen)"
            ]
          }
        ]
      },
      {
        "id": "apple-audio",
        "name": "Audio",
        "models": [
          {
            "id": "apple-airpods-pro",
            "name": "AirPods Pro",
            "generations": [
              "3",
              "(2nd gen)",
              "(1st gen)"
            ]
          },
          {
            "id": "apple-airpods-max",
            "name": "AirPods Max",
            "generations": [
              "2",
              "(1st gen)"
            ]
          },
          {
            "id": "apple-airpods",
            "name": "AirPods",
            "generations": [
              "4 (ANC)",
              "4",
              "(3rd gen)",
              "(2nd gen)"
            ]
          }
        ]
      },
      {
        "id": "apple-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "apple-homepod",
            "name": "HomePod",
            "generations": [
              "(2nd gen)",
              "(1st gen)"
            ]
          },
          {
            "id": "apple-homepod-mini",
            "name": "HomePod mini",
            "generations": []
          }
        ]
      }
    ]
  },
  {
    "id": "samsung",
    "name": "Samsung",
    "categories": [
      {
        "id": "samsung-phone",
        "name": "Phone",
        "models": [
          {
            "id": "samsung-galaxy",
            "name": "Galaxy",
            "generations": [
              "S26 Ultra",
              "S25 Ultra",
              "S24 FE",
              "Z Fold 7",
              "Z Flip 7",
              "A57 5G",
              "A56",
              "A36",
              "A27 5G",
              "A17 5G",
              "A17 4G",
              "A07 4G"
            ]
          }
        ]
      },
      {
        "id": "samsung-tablet",
        "name": "Tablet",
        "models": [
          {
            "id": "samsung-galaxy-tab",
            "name": "Galaxy Tab",
            "generations": [
              "S11 Ultra",
              "S10 FE+",
              "A11+",
              "A11"
            ]
          }
        ]
      },
      {
        "id": "samsung-laptop",
        "name": "Laptop",
        "models": [
          {
            "id": "samsung-galaxy",
            "name": "Galaxy",
            "generations": [
              "Book6 Pro",
              "Chromebook Go 14\""
            ]
          }
        ]
      },
      {
        "id": "samsung-watch",
        "name": "Watch",
        "models": [
          {
            "id": "samsung-galaxy-watch",
            "name": "Galaxy Watch",
            "generations": [
              "8",
              "FE"
            ]
          }
        ]
      },
      {
        "id": "samsung-audio",
        "name": "Audio",
        "models": [
          {
            "id": "samsung-galaxy-buds",
            "name": "Galaxy Buds",
            "generations": [
              "4 Pro",
              "4"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "google",
    "name": "Google",
    "categories": [
      {
        "id": "google-phone",
        "name": "Phone",
        "models": [
          {
            "id": "google-pixel",
            "name": "Pixel",
            "generations": [
              "10 Pro Fold",
              "10 Pro",
              "10a",
              "8a"
            ]
          }
        ]
      },
      {
        "id": "google-tablet",
        "name": "Tablet",
        "models": [
          {
            "id": "google-pixel-tablet",
            "name": "Pixel Tablet",
            "generations": []
          }
        ]
      },
      {
        "id": "google-watch",
        "name": "Watch",
        "models": [
          {
            "id": "google-pixel-watch",
            "name": "Pixel Watch",
            "generations": [
              "4"
            ]
          }
        ]
      },
      {
        "id": "google-audio",
        "name": "Audio",
        "models": [
          {
            "id": "google-pixel-buds",
            "name": "Pixel Buds",
            "generations": [
              "Pro 2"
            ]
          }
        ]
      },
      {
        "id": "google-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "google-nest",
            "name": "Nest",
            "generations": [
              "Hub Max",
              "Learning Thermostat (4th gen)",
              "Thermostat (2020)",
              "Doorbell (3rd gen, wired)"
            ]
          },
          {
            "id": "google-nest-x-yale",
            "name": "Nest x Yale",
            "generations": [
              "Smart Lock"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "motorola",
    "name": "Motorola",
    "categories": [
      {
        "id": "motorola-phone",
        "name": "Phone",
        "models": [
          {
            "id": "motorola-moto",
            "name": "Moto",
            "generations": [
              "G 2025",
              "G Stylus",
              "G Power",
              "G Play",
              "G85 5G",
              "G56"
            ]
          },
          {
            "id": "motorola-edge",
            "name": "Edge",
            "generations": [
              "70 Fusion"
            ]
          }
        ]
      },
      {
        "id": "motorola-tablet",
        "name": "Tablet",
        "models": [
          {
            "id": "motorola-motopad",
            "name": "MotoPad",
            "generations": [
              "(2026)"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "oneplus",
    "name": "OnePlus",
    "categories": [
      {
        "id": "oneplus-phone",
        "name": "Phone",
        "models": [
          {
            "id": "oneplus-oneplus",
            "name": "OnePlus",
            "generations": [
              "13R"
            ]
          },
          {
            "id": "oneplus-nord",
            "name": "Nord",
            "generations": [
              "N-series"
            ]
          }
        ]
      },
      {
        "id": "oneplus-watch",
        "name": "Watch",
        "models": [
          {
            "id": "oneplus-watch",
            "name": "Watch",
            "generations": [
              "2R"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "nothing",
    "name": "Nothing",
    "categories": [
      {
        "id": "nothing-phone",
        "name": "Phone",
        "models": [
          {
            "id": "nothing-phone",
            "name": "Phone",
            "generations": [
              "(4b)",
              "(3a)"
            ]
          }
        ]
      },
      {
        "id": "nothing-watch",
        "name": "Watch",
        "models": [
          {
            "id": "nothing-cmf",
            "name": "CMF",
            "generations": [
              "Watch 3 Pro"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "tcl",
    "name": "TCL",
    "categories": [
      {
        "id": "tcl-phone",
        "name": "Phone",
        "models": [
          {
            "id": "tcl-tcl",
            "name": "TCL",
            "generations": [
              "50 series",
              "40 series"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "hp",
    "name": "HP",
    "categories": [
      {
        "id": "hp-laptop",
        "name": "Laptop",
        "models": [
          {
            "id": "hp-hp",
            "name": "HP",
            "generations": [
              "17 series",
              "15 series",
              "14 series"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "dell",
    "name": "Dell",
    "categories": [
      {
        "id": "dell-laptop",
        "name": "Laptop",
        "models": [
          {
            "id": "dell-xps",
            "name": "XPS",
            "generations": []
          }
        ]
      }
    ]
  },
  {
    "id": "alienware",
    "name": "Alienware",
    "categories": [
      {
        "id": "alienware-laptop",
        "name": "Laptop",
        "models": [
          {
            "id": "alienware-alienware",
            "name": "Alienware",
            "generations": [
              "16X Aurora"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "lenovo",
    "name": "Lenovo",
    "categories": [
      {
        "id": "lenovo-tablet",
        "name": "Tablet",
        "models": [
          {
            "id": "lenovo-tab",
            "name": "Tab",
            "generations": [
              "Plus"
            ]
          },
          {
            "id": "lenovo-idea-tab",
            "name": "Idea Tab",
            "generations": []
          }
        ]
      },
      {
        "id": "lenovo-laptop",
        "name": "Laptop",
        "models": [
          {
            "id": "lenovo-yoga",
            "name": "Yoga",
            "generations": []
          },
          {
            "id": "lenovo-ideapad",
            "name": "IdeaPad",
            "generations": [
              "Pro series"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "asus",
    "name": "Asus",
    "categories": [
      {
        "id": "asus-laptop",
        "name": "Laptop",
        "models": [
          {
            "id": "asus-zenbook",
            "name": "Zenbook",
            "generations": [
              "A14"
            ]
          },
          {
            "id": "asus-proart",
            "name": "ProArt",
            "generations": [
              "PZ14"
            ]
          },
          {
            "id": "asus-chromebook-plus",
            "name": "Chromebook Plus",
            "generations": [
              "CX34"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "acer",
    "name": "Acer",
    "categories": [
      {
        "id": "acer-laptop",
        "name": "Laptop",
        "models": [
          {
            "id": "acer-swift",
            "name": "Swift",
            "generations": [
              "16 AI",
              "Go 16 AI"
            ]
          },
          {
            "id": "acer-nitro",
            "name": "Nitro",
            "generations": [
              "V 16 AI"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "msi",
    "name": "MSI",
    "categories": [
      {
        "id": "msi-laptop",
        "name": "Laptop",
        "models": [
          {
            "id": "msi-prestige",
            "name": "Prestige",
            "generations": [
              "16 AI+"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "lg",
    "name": "LG",
    "categories": [
      {
        "id": "lg-laptop",
        "name": "Laptop",
        "models": [
          {
            "id": "lg-gram",
            "name": "gram",
            "generations": [
              "Pro 16"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "framework",
    "name": "Framework",
    "categories": [
      {
        "id": "framework-laptop",
        "name": "Laptop",
        "models": [
          {
            "id": "framework-framework-laptop",
            "name": "Framework Laptop",
            "generations": [
              "13"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "gateway",
    "name": "Gateway",
    "categories": [
      {
        "id": "gateway-laptop",
        "name": "Laptop",
        "models": [
          {
            "id": "gateway-gateway",
            "name": "Gateway",
            "generations": [
              "16\" FHD Windows 11"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "microsoft",
    "name": "Microsoft",
    "categories": [
      {
        "id": "microsoft-tablet",
        "name": "Tablet",
        "models": [
          {
            "id": "microsoft-surface",
            "name": "Surface",
            "generations": [
              "Pro 11"
            ]
          }
        ]
      },
      {
        "id": "microsoft-laptop",
        "name": "Laptop",
        "models": [
          {
            "id": "microsoft-surface",
            "name": "Surface",
            "generations": [
              "Pro (base)"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "amazon",
    "name": "Amazon",
    "categories": [
      {
        "id": "amazon-tablet",
        "name": "Tablet",
        "models": [
          {
            "id": "amazon-fire",
            "name": "Fire",
            "generations": [
              "Max 11",
              "HD 10 Kids",
              "HD 8 Kids Pro",
              "HD 8",
              "7 Kids"
            ]
          }
        ]
      },
      {
        "id": "amazon-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "amazon-echo",
            "name": "Echo",
            "generations": [
              "Hub",
              "Show 8",
              "(4th gen)",
              "Dot Max",
              "Pop"
            ]
          },
          {
            "id": "amazon-smart-thermostat",
            "name": "Smart Thermostat",
            "generations": []
          },
          {
            "id": "amazon-smart-plug",
            "name": "Smart Plug",
            "generations": []
          }
        ]
      }
    ]
  },
  {
    "id": "blink",
    "name": "Blink",
    "categories": [
      {
        "id": "blink-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "blink-blink",
            "name": "Blink",
            "generations": [
              "Battery Doorbell 2K+",
              "Mini 2"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "ring",
    "name": "Ring",
    "categories": [
      {
        "id": "ring-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "ring-ring",
            "name": "Ring",
            "generations": [
              "Battery Doorbell Pro"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "remarkable",
    "name": "reMarkable",
    "categories": [
      {
        "id": "remarkable-tablet",
        "name": "Tablet",
        "models": [
          {
            "id": "remarkable-paper-pro",
            "name": "Paper Pro",
            "generations": []
          }
        ]
      }
    ]
  },
  {
    "id": "garmin",
    "name": "Garmin",
    "categories": [
      {
        "id": "garmin-watch",
        "name": "Watch",
        "models": [
          {
            "id": "garmin-venu",
            "name": "Venu",
            "generations": [
              "4"
            ]
          },
          {
            "id": "garmin-forerunner",
            "name": "Forerunner",
            "generations": [
              "165"
            ]
          },
          {
            "id": "garmin-vivosmart",
            "name": "vivosmart",
            "generations": [
              "5"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "fitbit",
    "name": "Fitbit",
    "categories": [
      {
        "id": "fitbit-watch",
        "name": "Watch",
        "models": [
          {
            "id": "fitbit-sense",
            "name": "Sense",
            "generations": [
              "2"
            ]
          },
          {
            "id": "fitbit-charge",
            "name": "Charge",
            "generations": [
              "6"
            ]
          },
          {
            "id": "fitbit-inspire",
            "name": "Inspire",
            "generations": [
              "3"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "amazfit",
    "name": "Amazfit",
    "categories": [
      {
        "id": "amazfit-watch",
        "name": "Watch",
        "models": [
          {
            "id": "amazfit-active",
            "name": "Active",
            "generations": [
              "2"
            ]
          },
          {
            "id": "amazfit-bip",
            "name": "Bip",
            "generations": [
              "6"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "bose",
    "name": "Bose",
    "categories": [
      {
        "id": "bose-audio",
        "name": "Audio",
        "models": [
          {
            "id": "bose-quietcomfort",
            "name": "QuietComfort",
            "generations": [
              "Ultra Earbuds (2nd gen)",
              "Earbuds (2024)"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "sennheiser",
    "name": "Sennheiser",
    "categories": [
      {
        "id": "sennheiser-audio",
        "name": "Audio",
        "models": [
          {
            "id": "sennheiser-momentum",
            "name": "Momentum",
            "generations": [
              "True Wireless 4"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "master-dynamic",
    "name": "Master & Dynamic",
    "categories": [
      {
        "id": "master-dynamic-audio",
        "name": "Audio",
        "models": [
          {
            "id": "master-dynamic-mw08",
            "name": "MW08",
            "generations": []
          }
        ]
      }
    ]
  },
  {
    "id": "anker-soundcore",
    "name": "Anker Soundcore",
    "categories": [
      {
        "id": "anker-soundcore-audio",
        "name": "Audio",
        "models": [
          {
            "id": "anker-soundcore-space",
            "name": "Space",
            "generations": [
              "A40"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "sony",
    "name": "Sony",
    "categories": [
      {
        "id": "sony-audio",
        "name": "Audio",
        "models": [
          {
            "id": "sony-wf-c710n",
            "name": "WF-C710N",
            "generations": []
          }
        ]
      }
    ]
  },
  {
    "id": "ecobee",
    "name": "ecobee",
    "categories": [
      {
        "id": "ecobee-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "ecobee-smart-thermostat",
            "name": "Smart Thermostat",
            "generations": [
              "Premium",
              "Enhanced"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "schlage",
    "name": "Schlage",
    "categories": [
      {
        "id": "schlage-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "schlage-encode",
            "name": "Encode",
            "generations": []
          }
        ]
      }
    ]
  },
  {
    "id": "kwikset",
    "name": "Kwikset",
    "categories": [
      {
        "id": "kwikset-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "kwikset-kevo",
            "name": "Kevo",
            "generations": []
          }
        ]
      }
    ]
  },
  {
    "id": "august",
    "name": "August",
    "categories": [
      {
        "id": "august-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "august-smart-lock",
            "name": "Smart Lock",
            "generations": [
              "Pro"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "dreame",
    "name": "Dreame",
    "categories": [
      {
        "id": "dreame-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "dreame-x60",
            "name": "X60",
            "generations": [
              "Max Ultra Complete"
            ]
          },
          {
            "id": "dreame-d10",
            "name": "D10",
            "generations": [
              "Plus Gen 2"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "roborock",
    "name": "Roborock",
    "categories": [
      {
        "id": "roborock-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "roborock-saros",
            "name": "Saros",
            "generations": [
              "20"
            ]
          },
          {
            "id": "roborock-qv",
            "name": "QV",
            "generations": [
              "35S"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "dyson",
    "name": "Dyson",
    "categories": [
      {
        "id": "dyson-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "dyson-spot-scrub-ai",
            "name": "Spot+Scrub Ai",
            "generations": []
          }
        ]
      }
    ]
  },
  {
    "id": "shark",
    "name": "Shark",
    "categories": [
      {
        "id": "shark-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "shark-powerdetect",
            "name": "PowerDetect",
            "generations": [
              "UV Reveal"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "eero",
    "name": "eero",
    "categories": [
      {
        "id": "eero-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "eero-eero",
            "name": "eero",
            "generations": [
              "7"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "philips",
    "name": "Philips",
    "categories": [
      {
        "id": "philips-smart-home",
        "name": "Smart Home",
        "models": [
          {
            "id": "philips-hue",
            "name": "Hue",
            "generations": [
              "bulbs"
            ]
          }
        ]
      }
    ]
  }
]
$json$;
  n_brands int;
  n_before int;
begin
  if to_regclass('public.site_settings') is null then
    raise exception 'public.site_settings does not exist. Apply the mobicare-business schema first — that is where the shared list lives.';
  end if;

  select jsonb_array_length(coalesce(content -> 'deviceManufacturers', '[]'::jsonb))
    into n_before
    from public.site_settings
   where id = 'mobicare-config';

  n_brands := jsonb_array_length(cat);

  insert into public.site_settings (id, content)
  values ('mobicare-config', jsonb_build_object('deviceManufacturers', cat))
  on conflict (id) do update
    set content    = public.site_settings.content || jsonb_build_object('deviceManufacturers', cat),
        updated_at = now();

  raise notice 'Device catalogue loaded: % brands (was %).', n_brands, coalesce(n_before, 0);
end;
$$;
