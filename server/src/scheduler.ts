import cron from "node-cron";
import { config } from "./config.js";
import { checkAllFeeds } from "./services/feedMonitor.js";

export function startScheduler(): void {
  const minutes = Math.max(1, config.checkIntervalMinutes);
  const expression = `*/${minutes} * * * *`;

  console.log(`Scheduler iniciado: checando feeds a cada ${minutes} minuto(s).`);

  cron.schedule(expression, () => {
    checkAllFeeds()
      .then(({ feedsChecked, newPosts }) => {
        if (newPosts > 0) {
          console.log(`Checagem automática: ${feedsChecked} feed(s), ${newPosts} novo(s) post(s).`);
        }
      })
      .catch((err) => console.error("Erro na checagem automática:", err));
  });

  // Checa uma vez ao iniciar o servidor.
  checkAllFeeds().catch((err) => console.error("Erro na checagem inicial:", err));
}
