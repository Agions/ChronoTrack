# 贡献指南

感谢您对ChronoTrack项目的关注！我们欢迎各种形式的贡献，包括但不限于功能开发、bug修复、文档改进等。

## 开发流程

1. Fork 这个仓库
2. 克隆你的 fork 到本地：`git clone git@github.com:YOUR_USERNAME/ChronoTrack.git`
3. 创建新的功能分支：`git checkout -b feature/your-feature-name`
4. 安装依赖：`pnpm install`
5. 进行开发
6. 提交代码：`git commit -m "feat: 添加了xxx功能"`
7. 推送到你的 fork：`git push origin feature/your-feature-name`
8. 创建 Pull Request

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范，请按以下格式提交代码：

- `feat`: 新功能
- `fix`: 修复Bug
- `docs`: 文档更新
- `style`: 代码格式调整，不影响代码逻辑
- `refactor`: 重构代码，不添加新功能或修复Bug
- `perf`: 性能优化
- `test`: 添加或修改测试用例
- `chore`: 构建过程或辅助工具的变动

示例：`feat: 添加用户头像上传功能`

## 代码规范

- 请确保代码通过 ESLint 检查：`pnpm run lint`
- 添加适当的单元测试
- 遵循项目现有的代码风格和模式
- 保持代码简洁、可读性高
- 使用有意义的变量名和函数名

## Pull Request 规范

- 每个 PR 只做一件事情，保持变更集中
- PR 标题应遵循提交规范
- 在 PR 描述中详细说明变更内容和原因
- 关联相关的 Issue（如果有）
- 确保所有检查都通过

## 问题反馈

如果您发现了 Bug 或有新功能建议，请创建 Issue 并提供以下信息：

- Bug 报告：描述问题、复现步骤、预期行为和实际行为
- 功能请求：描述需求、使用场景和预期效果

## 分支策略

- `main`: 主分支，用于发布
- `develop`: 开发分支，最新的开发代码
- `feature/*`: 功能分支，用于开发新功能
- `fix/*`: 修复分支，用于修复 Bug
- `release/*`: 发布分支，用于准备发布

## 许可证

通过提交 PR，您同意您的贡献将在项目的 [MIT 许可证](LICENSE) 下发布。 