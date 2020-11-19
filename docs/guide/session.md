# 会话

调用方法是，Framework会依赖ThreadLocal,创建一个会话,通过可以拿到相关信息 如:

```java
WeforwardSession.TLS.getIp();
WeforwardSession.TLS.getUser();
```

>要获取user，需要配置UserAuthorizer并注入UserService.