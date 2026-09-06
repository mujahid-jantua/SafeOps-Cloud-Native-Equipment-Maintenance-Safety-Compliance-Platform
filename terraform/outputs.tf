output "application_public_url" {
  value       = "http://${module.compute.alb_dns_name}"
  description = "The public endpoint URL to access the Seplat Operations Hub Dashboard"
}
