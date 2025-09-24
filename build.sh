#!/bin/bash

# ANSI Color Codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Stop on first error
set -e

echo -e "${YELLOW}Starting Midas Select build process...${NC}"

# --- Step 1: Check and Install Dependencies ---
echo -e "\n${GREEN}Step 1/5: Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Node modules not found. Running 'npm install'..."
    npm install
else
    echo "Node modules already installed."
fi

# --- Step 2: Linting ---
echo -e "\n${GREEN}Step 2/5: Linting source code...${NC}"
npm run lint
echo -e "${GREEN}Linting complete. No issues found.${NC}"

# --- Step 3: Compiling TypeScript ---
echo -e "\n${GREEN}Step 3/5: Compiling TypeScript...${NC}"
npm run compile
echo -e "${GREEN}Compilation complete.${NC}"

# --- Step 4: Packaging with vsce ---
echo -e "\n${GREEN}Step 4/5: Packaging extension...${NC}"
# Check if vsce is installed globally
if ! command -v vsce &> /dev/null
then
    echo -e "${RED}Error: 'vsce' command not found.${NC}"
    echo -e "Please install it globally by running: ${YELLOW}npm install -g @vscode/vsce${NC}"
    exit 1
fi

vsce package
echo -e "${GREEN}Packaging complete!${NC}"

# Extract version from package.json to show the final filename
VERSION=$(node -p "require('./package.json').version")
VSIX_FILE="midas-select-${VERSION}.vsix"
echo -e "${YELLOW}Successfully created '${VSIX_FILE}' in the project root.${NC}"

# --- Step 5: Install Locally (Optional) ---
echo -e "\n${GREEN}Step 5/5: Install locally for testing (Optional)...${NC}"

# Check if 'code' command is available
if ! command -v code &> /dev/null
then
    echo -e "${YELLOW}VS Code 'code' command is not installed in PATH. Skipping local installation.${NC}"
    echo -e "To enable this, open VS Code, run 'Command Palette' (Cmd+Shift+P) and type 'Shell Command: Install code command in PATH'."
    exit 0
fi

# Ask the user for confirmation (bash compatible)
read -p "Install '${VSIX_FILE}' locally? [y/N] " response

# Check the response (case-insensitive and bash compatible)
case "$response" in
    [yY])
        echo -e "\n${YELLOW}Installing '${VSIX_FILE}'...${NC}"
        code --install-extension "${VSIX_FILE}"
        echo -e "${GREEN}Installation complete. Please restart VS Code to apply the changes.${NC}"
        ;;
    *)
        echo -e "\nSkipping local installation."
        ;;
esac

echo -e "\n${GREEN}Build process finished successfully!${NC}\n"
