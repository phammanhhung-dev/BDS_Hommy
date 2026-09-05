---
config:
  layout: elk
---
flowchart TB
  %% ===== HOMMY PLATFORM (Nền tảng chính - Cho thuê trọ) =====
  subgraph Hommy_Platform["🏠 HOMMY PLATFORM - Nền tảng cho thuê trọ"]
    direction TB
    subgraph Hommy_Users["Người dùng Hommy"]
      direction LR
      Tenant["🏠 Tenant`<br>`(Người thuê)"]
      Landlord["🏢 Landlord`<br>`(Chủ nhà)"]
      Sales["👔 Sales Staff`<br>`(Nhân viên Hommy)"]
    end
    subgraph Hommy_Services["Dịch vụ Hommy"]
      direction LR
      Hommy_Web["🌐 Hommy Web App`<br>`daphongtro.dev (DevTunnel)"]
      Hommy_Mobile["📱 Hommy Mobile`<br>`(coming soon)"]
      Hommy_API["⚡ Hommy API`<br>`Backend Services"]
    end
  end

  %% ===== HOMMY DEV INFRA (daphongtro + DevTunnels) =====
  subgraph Hommy_Dev["🖥️ HOMMY DEV INFRA - VS Code DevTunnels"]
    direction TB
    subgraph DevTunnels["DevTunnel Forwarders (.asse.devtunnels.ms)"]
      Tunnel5173["🔐 {id}-5173 → Vite dev server`<br>`HTTPS proxy :5173"]
      Tunnel5000["🔐 {id}-5000 → Express API + Socket.IO`<br>`HTTPS + WSS proxy :5000"]
    end
    subgraph DevMachine["Máy dev Windows + VS Code"]
      direction TB
      VSCode["VS Code + DevTunnel CLI`<br>`npm run dev & npm start"]
      subgraph Frontend_Dev["Frontend (client/)"]
        direction TB
        Vite["Vite dev server :5173`<br>`React + TanStack Query"]
        MapLeaflet["react-leaflet + Leaflet`<br>`Bản đồ chi tiết tin đăng"]
        ChatWidget["ChatBot component`<br>`Trang chủ Hommy"]
      end
      subgraph Backend_Dev["Backend (server/)"]
        direction TB
        Express["Express REST API + Socket.IO`<br>`Port 5000"]
        Routes["Routes: /api/chu-du-an, /api/chat`<br>`/api/geocode, /api/chatbot"]
        CronJobs["node-cron jobs`<br>`appointment reminders/report"]
        SepaySync["SepaySyncService`<br>`Poll giao dịch 60s"]
      end
      subgraph DataLayer["Tầng dữ liệu nội bộ"]
        MySQL["MySQL (XAMPP)`<br>`Database thue_tro"]
        Uploads["Static /uploads`<br>`Ảnh phòng & tài liệu"]
      end
    end
    subgraph Hommy_External["Dịch vụ ngoài (Hommy)"]
      direction TB
      Sepay["Sepay Banking API`<br>`https://my.sepay.vn"]
      OSMTiles["OpenStreetMap Tiles`<br>`https://{s}.tile.openstreetmap.org"]
      Nominatim["Nominatim Geocoding API`<br>`openstreetmap.org"]
      Groq["Groq Chat Completion API`<br>`llama-3.3-70b-versatile"]
    end
  end

  %% ===== DNS & CDN LAYER =====
  subgraph DNS_CDN["🌐 DNS & CDN LAYER (JB Calling)"]
    direction TB
    subgraph Hostinger_DNS["Hostinger DNS Management"]
      DNS_JB["📍 jbcalling.site DNS`<br>`A → 35.185.191.80`<br>`AAAA → 2600:1900:4080:470::1"]
      DNS_Subdomains["📍 Subdomains`<br>`webrtc/stt/translation/tts/grafana.jbcalling.site"]
    end
    subgraph Open_Connect["🚀 Open Connect CDN"]
      CDN_Static["📦 Static Assets`<br>`JS/CSS/Images"]
      CDN_Cache["⚡ Edge Caching`<br>`Low Latency Delivery"]
    end
  end

  %% ===== GOOGLE CLOUD PLATFORM =====
  subgraph GCP["☁️ GOOGLE CLOUD PLATFORM - asia-southeast1-a"]
    direction TB
    subgraph JB_Calling["📞 JB CALLING - Video Call Dịch Song Ngữ"]
      direction TB
      subgraph Gateway_Layer["🔀 API GATEWAY - translation01"]
        direction TB
        Traefik["🚦 Traefik v3.6`<br>`Reverse Proxy`<br>`Let's Encrypt SSL :80/:443"]
        Gateway["🌐 Gateway Service`<br>`TypeScript + Socket.IO`<br>`MediaSoup SFU :3000 + UDP 40000-40019"]
        Frontend["📱 Frontend x3`<br>`React App :80"]
      end
      subgraph Media_Layer["📡 WEBRTC MEDIA LAYER"]
        direction TB
        MediaSoup["📹 MediaSoup SFU`<br>`2 Workers`<br>`UDP 40000-40019"]
        Coturn["🔄 Coturn TURN`<br>`:3478 / :5349`<br>`UDP 49152-49156"]
      end
      subgraph AI_Pipeline["🤖 AI TRANSLATION PIPELINE"]
        direction TB
        subgraph AI_Node2["🖥️ translation02 (8 vCPUs)"]
          subgraph STT_Service["🎤 STT Service"]
            STT["Sherpa-ONNX :8002"]
            STT_VI["🇻🇳 VI Offline`<br>`zipformer-vi-int8"]
            STT_EN["🇺🇸 EN Streaming`<br>`zipformer-en"]
          end
          subgraph Trans_Service["🌍 Translation Service"]
            Translation["CTranslate2 INT8 :8005"]
            VI2EN["🇻🇳→🇺🇸 vi2en"]
            EN2VI["🇺🇸→🇻🇳 en2vi"]
          end
          TTS02["🔊 TTS Piper :8004"]
        end
        subgraph AI_Node3["🖥️ translation03 (4 vCPUs)"]
          TTS03["🔊 TTS Piper :8004"]
        end
        subgraph TTS_Models["🎵 Voice Models"]
          TTS_VI["🇻🇳 vi_VN-vais1000"]
          TTS_EN["🇺🇸 en_US-lessac"]
        end
      end
      subgraph Data_Monitor["💾 DATA & MONITORING"]
        direction TB
        subgraph Redis_Cluster["Redis Cluster"]
          Redis["translation01 Redis Cache :6379"]
          RedisGW["translation02 Redis :6379"]
        end
        subgraph Monitoring["📊 Monitoring Stack"]
          Prometheus["📈 Prometheus"]
          Grafana["📊 Grafana`<br>`grafana.jbcalling.site"]
          Loki["📝 Loki"]
        end
      end
    end
  end

  %% ===== CONNECTIONS =====
  Hommy_Users --> Hommy_Services

  %% Hommy Web/App ↔ DevTunnels & Backend cục bộ
  Hommy_Services -->|"HTTPS"| DevTunnel5173
  DevTunnel5173 -->|"Proxy :5173"| Vite
  Vite -->|"REST + Socket.IO client"| DevTunnel5000
  DevTunnel5000 -->|"Proxy :5000"| Express
  Express -->|"CRUD dữ liệu"| MySQL
  Express -->|"Serve static uploads"| Uploads

  %% Geocoding & bản đồ (Hommy)
  Express -->|"Forward /api/geocode"| Nominatim
  MapLeaflet -->|"Tải tile"| OSMTiles

  %% Chatbot (Hommy ↔ Groq)
  ChatWidget -->|"POST /api/chatbot"| Express
  Express -->|"LLM completions"| Groq

  %% Sepay Banking (Hommy)
  SepaySync -->|"GET /userapi/transactions/list"| Sepay
  SepaySync -->|"Ghi ledger"| MySQL

  %% Hommy → JB Calling Integration (iframe/SDK)
  ChatUI["💬 Chat & Video Call UI`<br>`(Hommy Web)"]
  Hommy_Web --> ChatUI
  ChatUI ==>|"Open JB Calling URL`<br>`https://jbcalling.site/room/:roomId?data=..."| DNS_JB
  DNS_JB -->|"DNS Resolve"| Traefik
  DNS_Subdomains -->|"DNS Resolve"| Traefik
  Frontend -->|"Static Assets"| CDN_Static
  CDN_Static --> CDN_Cache
  CDN_Cache -->|"Cached Response"| Hommy_Users
  Traefik -.->|"Route HTTP/S"| Frontend
  Traefik -.->|"WebSocket"| Gateway
  Gateway -->|"RTP/SRTP"| MediaSoup
  MediaSoup -->|"ICE Relay"| Coturn
  Gateway ==>|"PCM 48kHz"| STT
  STT --> STT_VI & STT_EN
  STT ==>|"Text"| Translation
  Translation --> VI2EN & EN2VI
  Translation ==>|"Translated"| TTS02 & TTS03
  TTS02 --> TTS_VI & TTS_EN
  TTS03 --> TTS_VI & TTS_EN
  TTS02 ==>|"Audio+Caption"| Gateway
  TTS03 ==>|"Audio+Caption"| Gateway
  Gateway -->|"Pub/Sub"| RedisGW
  STT -->|"Cache"| Redis
  Translation -->|"Cache"| Redis
  Gateway -.->|"Metrics"| Prometheus
  STT -.->|"Metrics"| Prometheus
  Translation -.->|"Metrics"| Prometheus
  Prometheus --> Grafana
  Gateway -.->|"Logs"| Loki
  Loki --> Grafana

  %% ===== STYLING =====
  classDef hommy fill:#E8F5E9,stroke:#1B5E20,stroke-width:3px
  classDef dns fill:#E3F2FD,stroke:#0D47A1,stroke-width:2px
  classDef cdn fill:#FFF8E1,stroke:#FF6F00,stroke-width:2px
  classDef gcp fill:#FCE4EC,stroke:#880E4F,stroke-width:3px
  classDef jbcalling fill:#F3E5F5,stroke:#4A148C,stroke-width:2px
  classDef gateway fill:#FFF3E0,stroke:#E65100,stroke-width:2px
  classDef media fill:#E0F2F1,stroke:#00695C,stroke-width:2px
  classDef ai fill:#FCE4EC,stroke:#C2185B,stroke-width:2px
  classDef data fill:#EDE7F6,stroke:#512DA8,stroke-width:2px
  classDef model fill:#FFFDE7,stroke:#F9A825,stroke-width:1px
  classDef devinfra fill:#FFF3E0,stroke:#E65100,stroke-width:2px
  classDef externalhommy fill:#FCE4EC,stroke:#C2185B,stroke-width:2px

  class Hommy_Platform hommy
  class Hommy_Dev,DevTunnels,DevMachine,Frontend_Dev,Backend_Dev devinfra
  class Hommy_External,Sepay,OSMTiles,Nominatim,Groq externalhommy
  class DNS_CDN,Hostinger_DNS dns
  class Open_Connect cdn
  class GCP gcp
  class JB_Calling jbcalling
  class Gateway_Layer gateway
  class Media_Layer media
  class AI_Pipeline ai
  class Data_Monitor data
  class STT_VI,STT_EN,VI2EN,EN2VI,TTS_VI,TTS_EN model

