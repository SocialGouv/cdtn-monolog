{{ define "job.monolog" }}
spec:
  backoffLimit: 1
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: update-monolog
          image: "{{ or .Values.registry .Values.global.registry }}/{{ .Values.global.imageProject }}/{{ .Values.global.imageRepository }}/monolog:{{ .Values.global.imageTag }}"
          resources:
            requests:
              cpu: 1500m
              memory: 20Gi
            limits:
              cpu: 2000m
              memory: 30Gi
          workingDir: /app
          env:
            - name: PRODUCTION
              value: 'true'
          envFrom:
            - configMapRef:
                name: monolog
            - secretRef:
                name: monolog
          volumeMounts:
            - name: tz-paris
              mountPath: /etc/localtime
      volumes:
        - name: tz-paris
          hostPath:
            path: /usr/share/zoneinfo/Europe/Paris
{{end}}
