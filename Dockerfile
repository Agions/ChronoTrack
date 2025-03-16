FROM node:18-alpine

# 创建应用目录
WORKDIR /usr/src/app

# 复制依赖文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 暴露端口
EXPOSE 5000

# 启动应用
CMD ["node", "dist/main"] 