[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# AutoBrowse
Automate any web browsing task; AutoBrowse is best used for automatic social media engagement farming (using the dedicated social media mode), or just general browser tasks.

## Backend

Dependencies for the backend are managed with `uv` and the `backend/pyproject.toml` file.

### Installing Dependencies

Set up the virtual environment and install dependencies:

```bash
uv venv                   
source .venv/bin/activate 
cd backend
uv sync                   
deactivate               
```

### Adding a New Dependency

To add a new dependency:

1.  Open `backend/pyproject.toml`.
2.  Add the new package to the `dependencies` list. For example, to add `requests`:
    ```toml
    # ...
    dependencies = [
        "fastapi[all]",
        "uvicorn",
        "requests"
    ]
    # ...
    ```
3.  Install the new dependency by running `uv sync` again:
    ```bash
    uv sync
    ```

    Alternatively, let `uv` handle both the install **and** the `pyproject.toml` update in one step (example):
    ```bash
    uv add requests
    ```

### Starting the Server

Before running the server (especially after a `git pull`), update dependencies inside the venv:

```bash
source .venv/bin/activate
uv sync
```

Then start the backend server from the backend directory:

```bash
./run.sh
```

## Extension

To start the Chrome extension development server, run the following commands from the root directory:

```bash
cd extension
npm install
npm run dev
``` 
