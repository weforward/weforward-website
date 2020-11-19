# 资源

对于资源的处理操作需要分两步

获取资源id→上传/下载

当方法的返回值实现了WeforwardResource接口时，调用端即可获取资源id
```java
@WeforwardMethod
public WeforwardResource index() {
	return WeforwardResourceHelper.valueOf("1.zip", 3600);
}
```

处理上传操作的类需要实现ResourceUploader
```java
@WeforwardMethods
public class HomeMethods implements ResourceUploader {

	@WeforwardMethod
	public WeforwardResource index() {
		return WeforwardResourceHelper.valueOf("1.zip", 3600);
	}

	public boolean saveFile(String resourceId, WeforwardFile... files) throws IOException {
		if (StringUtil.eq(resourceId, "1.zip")) {
			// TODO 保存数据
			return true;
		}
		return false;
	}
}
```

处理下载操作的类需要实现ResourceDownloader
```java
@WeforwardMethods
public class HomeMethods implements ResourceDownloader {

	@WeforwardMethod
	public WeforwardResource index() {
		return WeforwardResourceHelper.valueOf("1.zip", 3600);
	}

	public WeforwardFile findFile(String resourceId) throws IOException {
		if (StringUtil.eq(resourceId, "1.zip")) {
			InputStream in = new ByteArrayInputStream("HelloWrold".getBytes());
			return WeforwardResourceHelper.newFile("1.zip", in);
		}
		return null;
	}
}

```