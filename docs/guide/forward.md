# 转发

当资源需要由特定实例处理时，我们可以使用转发策略，将请求转发到特定实例。

## 开启支持回源

通过调用WeforwardService的setForwardEnable可启用转发支持

```xml
	<bean id="service"
		class="cn.weforward.framework.ext.WeforwardService">
		...
		<property name="setForwardEnable" value="true"/>
		...
	</bean>
```

支持转发的请求数据的最大字节数据默认为2m,如果该服务的请求可能大于该值，则可通过setRequestMaxSize指定。

## 转发

在服务开启转发的提前下，我们在方法里面抛出ForwardException异常即可让网关转发请求。
```java
@WeforwardMethod
public String helloWorld() throws ApiException {
	throw new ForwardException("另一个服务的编号");
}
```
ForwardException还指供了一些快捷方法 如:

判断对象是否需要转发
```java
@WeforwardMethod
public void helloWorld() throws ApiException {
	Object object = new DistributedObject() {

		public boolean iDo() {
			return false;
		}

		public String getDriverIt() {
			return "另一个网关编号";
		}
	};
	ForwardException.forwardToIfNeed(object);
	System.out.println(object.toString());
}
```

> 对象需要实现DistributedObject接口
指定转换到备份服务
```java
@WeforwardMethod
public void helloWorld() throws ApiException {
	boolean overload = false;
	if (overload) {
		ForwardException.forwardBackUp();
	}
}
```