# looksMiner

## 提前准备的参数及说明（对应.env中的变量）
- LOOKSRARE_API_KEY. 可以去Looksrare Discord开票获得：discord.gg/LooksRareDevelopers
- ALCHEMY_API_KEY, 去 https://www.alchemy.com/ 免费注册获得
- BLOCKNATIVE_API_KEY，去 https://www.blocknative.com/ 免费注册获得
- SERVER_CHAN 用于推送状态至微信，建议填一下，可以去 https://sct.ftqq.com/login 免费注册获得
- PRIVATE_KEY 用于挖矿的钱包私钥
- PUBLIC_ADDRESS 用于挖矿的钱包地址
- PRICE_RATIO_RANGE：两个小数，用逗号间隔，第一个代表当前挂单不能低于地板的倍数（比如1.05倍），第二个代表不能超过的地板倍数（比如 1.1倍，获取最大收益的最低值）
- PRICE_MULTIPLIER：如果价格超出Range，应该将当前挂单调至当前地板的多少倍（比如1.08倍）
- HIGHER_PRICE_NFT_IDS： 如果有需要挂高一点的NFT，可以把编号写在这，用英文逗号`,`间隔

## 基础使用方法
- 首先将 `.env.example` 改名为 `.env` 然后将上面参数对应填入

- 将NFT转移至钱包，并确保钱包有足够余额用于取消挂单（取消一次大概几u）

- 确认本地网络已经全局科学上网

这里用pnpm，如果用npm或者yarn自行替换即可
```bash
pnpm install
pnpm build
pnpm run start
```

## Docker部署
```
docker-compose build
docker-compose up
```

## 配合服务器使用
使用服务器的corn完成定时自动启动

比如每15分钟自动检查价格并更改Looks挂单价
```bash
*/15 * * * * docker-compose --project-directory /这里改成你的目录/looksMiner/ up
```

