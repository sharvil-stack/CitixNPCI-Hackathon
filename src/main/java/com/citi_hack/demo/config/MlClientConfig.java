package com.citi_hack.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class MlClientConfig {

    @Bean
    public RestClient mlRestClient(
            @Value("${ml.service.url:http://localhost:8000}") String url,
            @Value("${ml.service.connect-timeout-seconds:3}") int connectSeconds,
            @Value("${ml.service.read-timeout-seconds:60}") int readSeconds) {

        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(connectSeconds))
                .build();

        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(readSeconds));

        return RestClient.builder()
                .baseUrl(url)
                .requestFactory(factory)
                .build();
    }
}