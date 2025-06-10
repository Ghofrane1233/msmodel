pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "ghofrane694/msmodel"
        REGISTRY_CREDENTIALS_ID = 'docker-hub-credentials-id'
        GIT_CREDENTIALS_ID = 'git-credentials-id'
    }

    stages {

        stage(' Cloner le dépôt Git') {
            steps {
                git credentialsId: "${GIT_CREDENTIALS_ID}", url: 'https://github.com/Ghofrane1233/msmodel.git', branch: 'main'
            }
        }

        stage(' Installer les dépendances') {
            steps {
                bat 'npm install'
            }
        }

        stage('Exécuter les tests') {
            steps {
                bat 'npx jest --forceExit --detectOpenHandles'
            }
        }

        stage('Build de l\'image Docker') {
            steps {
                script {
                    env.BUILT_IMAGE_ID = docker.build("${DOCKER_IMAGE}").id
                }
            }
        }

        stage(' Push vers Docker Hub') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', "${REGISTRY_CREDENTIALS_ID}") {
                        docker.image("${DOCKER_IMAGE}").push("latest")
                    }
                }
            }
        }

        stage(' Déploiement sur Kubernetes') {
            steps {
                script {
                    withKubeConfig([credentialsId: 'kubeconfig', serverUrl: 'https://127.0.0.1:52747']) {
                        bat 'kubectl apply -f db-secret.yaml --validate=false'
                        bat 'kubectl apply -f k8s/deployment.yaml --validate=false'
                        bat 'kubectl apply -f k8s/service.yaml --validate=false'
                    }
                }
            }
        }

        stage(' Déploiement de la stack de monitoring') {
            steps {
                script {
                    withKubeConfig([credentialsId: 'kubeconfig', serverUrl: 'https://127.0.0.1:52747']) {
                        bat 'kubectl apply -f monitoring/prometheus-config.yaml'
                        bat 'kubectl apply -f monitoring/prometheus-deployment.yaml'
                        bat 'kubectl apply -f monitoring/prometheus-service.yaml'
                        bat 'kubectl apply -f monitoring/grafana-deployment.yaml'
                        bat 'kubectl apply -f monitoring/grafana-service.yaml'
                    }
                }
            }
        }
    }

    post {
        success {
            echo " Déploiement terminé avec succès sur Minikube."
        }
        failure {
            echo " La pipeline a échoué. Vérifiez les logs pour plus de détails."
        }
    }
}
