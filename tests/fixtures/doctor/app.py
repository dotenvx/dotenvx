from dotenv import load_dotenv, dotenv_values

load_dotenv(override=True)
settings = dotenv_values(".env")
