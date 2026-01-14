# 📁 file-aranger

A powerful and minimal CLI tool to automatically organize files in a directory based on their extensions.  
No more messy download folders — just clean, categorized file structures in seconds.

---

## 🚀 Features

- ***Organizes files into human-readable folders by extension*** (e.g., `.jpg` → `Images`, `.mp4` → `Videos`, `.exe` → `Executables`)  
- ***Built with TypeScript + Node.js***  
- ***Can be used via CLI or imported into other Node projects***  
- ***Extensible and developer-friendly***

---

## 🛠 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/neuro-tx/file-aranger.git
cd file-aranger
```
```bash
npm install
npm run build
npm link
```

---
##🧪 Usage

### 📦 Programmatic Usage

```bash
import arange from "file-aranger";

await arange("C:/Users/yourname/Downloads");
```

### 📌 CLI

```bash
fm <path-to-your-folder>
```
- ***example***
```bash
fm C:/Users/yourname/Downloads
```

| Script          | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Run in dev mode with ts-node |
| `npm run build` | Compile to `dist/` folder    |
| `npm start`     | Run compiled app (index.js)  |


## 🤝 Contributing

***Pull requests are welcome! If you have suggestions for improvements or new features, feel free to open an issue or fork the repo.***

### 📜 License
***MIT — free to use, modify, and distribute.***

### Built with ❤️ in Node.js & TypeScript by '***neuro-tx***'