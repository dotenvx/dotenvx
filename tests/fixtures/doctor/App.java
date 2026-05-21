import io.github.cdimascio.dotenv.Dotenv;

class App {
  void boot() {
    Dotenv.load();
    Dotenv.configure().load();
  }
}
