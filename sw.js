const CACHE_NAME = "forget-check-v4";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon.png"
];


/* ========================================
   インストール
======================================== */

self.addEventListener("install", event => {

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );

  self.skipWaiting();
});


/* ========================================
   古いキャッシュを削除
======================================== */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches
      .keys()
      .then(keys => {

        return Promise.all(

          keys.map(key => {

            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }

            return null;
          })

        );

      })
      .then(() => {

        return self.clients.claim();

      })

  );
});


/* ========================================
   ファイル取得
   キャッシュ優先
======================================== */

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(

    caches
      .match(event.request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {

            if (
              response &&
              response.status === 200 &&
              response.type === "basic"
            ) {

              const responseClone =
                response.clone();

              caches
                .open(CACHE_NAME)
                .then(cache => {

                  cache.put(
                    event.request,
                    responseClone
                  );

                });

            }

            return response;

          })
          .catch(() => {

            return caches.match(
              "./index.html"
            );

          });

      })

  );
});


/* ========================================
   通知クリック
======================================== */

self.addEventListener(
  "notificationclick",
  event => {

    event.notification.close();

    event.waitUntil(

      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then(clientList => {

          /*
           * すでにアプリが開いている場合
           */
          for (const client of clientList) {

            if ("focus" in client) {

              return client.focus();

            }

          }

          /*
           * アプリが開いていない場合
           */
          if (clients.openWindow) {

            return clients.openWindow(
              "./index.html"
            );

          }

        })

    );

  }
);
